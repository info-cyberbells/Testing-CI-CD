import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import Sermon from '../model/sermonModel.js';
import User from '../model/authModel.js';
import moment from 'moment-timezone';
import UserListen from '../model/usersListen.js'
import cron from 'node-cron';

export const addSermon = async (req, res) => {
  try {
    const { churchId, adminStaffUserId, startDateTime, sermonName, status } = req.body;

    let startACST;

    if (startDateTime) {
      const incoming = moment.parseZone(startDateTime); // Keeps original zone if present
      const isACST = incoming.tz() === 'Australia/Adelaide' || incoming.format('Z') === '+09:30';

      startACST = isACST
        ? incoming
        : incoming.tz('Australia/Adelaide');
    } else {
      startACST = moment().tz('Australia/Adelaide');
    }

    const formattedStartACST = startACST.format('YYYY-MM-DD HH:mm:ss');

    const newSermon = new Sermon({
      churchId,
      adminStaffUserId,
      sermonName,
      startDateTime: formattedStartACST,
      status,
    });

    await newSermon.save();
    res.status(201).json({ message: "Sermon added successfully", sermon: newSermon });
  } catch (error) {
    res.status(500).json({ error: "Failed to add sermon", details: error.message });
  }
};

export const updateSermon = async (req, res) => {
  try {
    const { churchId, adminStaffUserId, sermonName, endDateTime, status } = req.body;

    let endACST;
    if (endDateTime) {
      const incoming = moment(endDateTime);
      if (!incoming.isValid()) {
        throw new Error('Invalid date format');
      }
      const offsetHours = incoming.utcOffset() / 60;
      if (offsetHours === 9.5) {
        endACST = incoming.format('YYYY-MM-DD HH:mm:ss'); // Already in GMT+9:30, format as string
      } else {
        // Convert to GMT+9:30
        endACST = incoming.clone().utcOffset('+09:30').format('YYYY-MM-DD HH:mm:ss');
      }
    }

    const updateData = {
      churchId,
      adminStaffUserId,
      sermonName,
      status,
      ...(endACST && { endDateTime: endACST }),
    };

    const updatedSermon = await Sermon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSermon) {
      return res.status(404).json({ message: "Sermon not found" });
    }

    res.status(200).json({ message: "Sermon updated successfully", sermon: updatedSermon });
  } catch (error) {
    res.status(500).json({ error: "Failed to update sermon", details: error.message });
  }
};



export const getSermons = async (req, res) => {
  try {
    const { churchId } = req.query;

    const query = churchId ? { churchId } : {};


    const sermons = await Sermon.find(query).populate('churchId', 'adminStaffUserId');

    console.log('Fetched sermons:', sermons);

    if (sermons.length === 0 && churchId) {
      return res.status(200).json([]);
    }

    res.status(200).json(sermons);
  } catch (error) {
    console.error('Error fetching sermons:', error);
    res.status(500).json({ error: 'Failed to fetch sermons', details: error.message });
  }
};


export const getSermonCount = async (req, res) => {
  try {
    const { churchId } = req.query;

    const query = churchId ? { churchId } : {};

    const sermonCount = await Sermon.countDocuments(query);

    console.log('Sermon count:', sermonCount);

    res.status(200).json({ "TotalSermonCount": sermonCount });
  } catch (error) {
    console.error('Error fetching sermon count:', error);
    res.status(500).json({ error: 'Failed to fetch sermon count', details: error.message });
  }
};



export const getSermonCountForUser = async (req, res) => {
  try {
    const { churchId, userId } = req.query;

    if (userId) {
      const query = { userId };
      if (churchId) {
        query.churchId = churchId;
      }

      // Get all UserListen records for the user (and church if provided)
      const userListens = await UserListen.find(query, 'sermonId');

      const sermonIds = userListens.map((listen) => listen.sermonId);

      // Filter only existing sermon IDs
      const existingSermons = await Sermon.find({ _id: { $in: sermonIds } }, '_id');

      const existingSermonIds = existingSermons.map((sermon) => sermon._id.toString());

      // Count how many of the user's listens are for existing sermons
      const validUserSermonCount = userListens.filter((listen) =>
        existingSermonIds.includes(listen.sermonId.toString())
      ).length;

      console.log(`Valid sermon count for user ${userId}:`, validUserSermonCount);

      res.status(200).json({ TotalUserSermonCount: validUserSermonCount });
    } else {
      const query = churchId ? { churchId } : {};

      const sermonCount = await Sermon.countDocuments(query);

      console.log('Sermon count:', sermonCount);

      res.status(200).json({ TotalSermonCount: sermonCount });
    }
  } catch (error) {
    console.error('Error fetching sermon count:', error);
    res.status(500).json({ error: 'Failed to fetch sermon count', details: error.message });
  }
};



export const getSermonById = async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id).populate("churchId adminStaffId");
    if (!sermon) {
      return res.status(404).json({ message: "Sermon not found" });
    }
    res.status(200).json(sermon);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sermon", details: error.message });
  }
};



// Delete Sermon
export const deleteSermon = async (req, res) => {
  try {
    const deletedSermon = await Sermon.findByIdAndDelete(req.params.id);
    if (!deletedSermon) {
      return res.status(404).json({ message: "Sermon not found" });
    }
    res.status(200).json({ message: "Sermon deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete sermon", details: error.message });
  }
};


// API to Check for Live Sermons
export const checkLiveSermons = async (req, res) => {
  try {
    // Find all sermons with status "Live"
    const liveSermons = await Sermon.find({ status: "Live" });

    // Update the status of live sermons to "Ended"
    await Promise.all(
      liveSermons.map(async (sermon) => {
        sermon.status = "End";
        await sermon.save();
      })
    );

    // Return whether there are any live sermons
    res.status(200).json({
      hasLiveSermon: liveSermons.length > 0,
      count: liveSermons.length,
      // Only return basic info about the live sermon(s)
      liveSermons: liveSermons.map((sermon) => ({
        id: sermon._id,
        churchId: sermon.churchId,
        startDateTime: sermon.startDateTime,
        status: "End"
      }))
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check live sermons", details: error.message });
  }
};



export const getLiveSermon = async (req, res) => {
  try {
    const { churchId } = req.query;

    if (!churchId) {
      return res.status(400).json({ error: 'churchId is required in query params' });
    }

    // Single aggregation pipeline to get everything at once
    const result = await Sermon.aggregate([
      // Match sermons for this church
      { $match: { churchId: new mongoose.Types.ObjectId(churchId) } },

      // Add fields to categorize sermons
      {
        $addFields: {
          isLive: { $eq: ["$status", "Live"] }
        }
      },

      // Group to get counts and live sermons
      {
        $group: {
          _id: "$churchId",
          totalSermons: { $sum: 1 },
          liveSermonCount: { $sum: { $cond: ["$isLive", 1, 0] } },
          liveSermons: {
            $push: {
              $cond: [
                "$isLive",
                "$$ROOT",
                "$$REMOVE"
              ]
            }
          }
        }
      }
    ]);

    if (!result.length || result[0].liveSermonCount === 0) {
      return res.status(404).json({ error: 'No live sermons found for this church' });
    }

    const { totalSermons, liveSermonCount, liveSermons } = result[0];

    // Get all unique user IDs from live sermons
    const userIds = [...new Set(
      liveSermons
        .map(sermon => sermon.adminStaffUserId)
        .filter(id => id)
    )];

    // Get all sermon IDs for listener count
    const sermonIds = liveSermons.map(sermon => sermon._id);

    // Parallel queries for users and listener counts
    const [users, listenerCounts] = await Promise.all([
      // Batch fetch all users at once
      userIds.length > 0 ? User.find(
        { _id: { $in: userIds } },
        { _id: 1, firstName: 1, lastName: 1 }
      ).lean() : Promise.resolve([]),

      // Batch count listeners for all sermons at once
      UserListen.aggregate([
        {
          $match: {
            sermonId: { $in: sermonIds },
            status: 'Live'
          }
        },
        {
          $group: {
            _id: "$sermonId",
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Create lookup maps for O(1) access
    const userMap = new Map(
      users.map(user => [
        user._id.toString(),
        {
          firstName: user.firstName || 'Unknown',
          lastName: user.lastName || 'User'
        }
      ])
    );

    const listenerMap = new Map(
      listenerCounts.map(item => [item._id.toString(), item.count])
    );

    // Process sermons with lookups
    const processedSermons = liveSermons.map(sermon => {
      const userId = sermon.adminStaffUserId?.toString();
      const sermonId = sermon._id.toString();

      const broadcasterUserDetails = userId
        ? userMap.get(userId) || { firstName: 'Unknown', lastName: 'User' }
        : { firstName: 'Unknown', lastName: 'User' };

      return {
        ...sermon,
        broadcaster_info: {
          ...sermon.broadcaster_info,
          userDetails: broadcasterUserDetails
        },
        listeners: listenerMap.get(sermonId) || 0
      };
    });

    res.status(200).json({
      totalSermons,
      liveSermonCount,
      liveSermons: processedSermons
    });

  } catch (error) {
    console.error("Error fetching sermons:", error);
    res.status(500).json({ error: "Failed to fetch sermons", details: error.message });
  }
};



// export const getLiveSermon = async (req, res) => {
//   try {
//     // Fetch live sermons
//     const liveSermons = await Sermon.find({ status: "Live" });

//     console.log("Live Sermons:", JSON.stringify(liveSermons, null, 2));

//     // Extract unique adminStaffUserIds
//     const adminStaffUserIds = [...new Set(liveSermons.map(sermon => sermon.adminStaffUserId).filter(id => id))];

//     console.log("Extracted Admin Staff User IDs:", adminStaffUserIds);

//     if (!adminStaffUserIds.length) {
//       return res.status(404).json({ message: "No admin staff found for live sermons" });
//     }

//     // Fetch admin staff users from User collection
//     const adminStaffUsers = await User.find({ _id: { $in: adminStaffUserIds } }).select('_id firstName lastName');

//     console.log("Admin Staff Users from DB:", adminStaffUsers);

//     if (!adminStaffUsers.length) {
//       return res.status(404).json({ message: "No matching admin staff found in the User collection" });
//     }

//     // Create a map for easy lookup
//     const adminStaffMap = new Map(adminStaffUsers.map(user => [user._id.toString(), user]));

//     // Attach admin staff details to each sermon
//     const response = liveSermons.map(sermon => {
//       const adminUser = adminStaffMap.get(sermon.adminStaffUserId?.toString());
//       return {
//         ...sermon.toObject(),
//         adminStaff: adminUser ? { firstName: adminUser.firstName, lastName: adminUser.lastName } : null
//       };
//     });

//     console.log("Final Response:", response);

//     res.status(200).json(response);
//   } catch (error) {
//     console.error("Error fetching live sermons:", error);
//     res.status(500).json({ error: "Failed to fetch live sermons", details: error.message });
//   }
// };






// // API to End All Live Sermons
// export const endAllLiveSermons = async (req, res) => {
//   try {
//     // Find all sermons with status "Live"
//     const liveSermons = await Sermon.find({ status: "Live" });

//     if (liveSermons.length === 0) {
//       return res.status(200).json({ message: "No live sermons found." });
//     }

//     // Update all live sermons to "End"
//     await Sermon.updateMany({ status: "Live" }, { status: "End" });

//     res.status(200).json({ message: "All live sermons have been ended successfully." });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to update sermons", details: error.message });
//   }
// };


// cron.schedule('0 9,15,21 * * *', async () => {
//   console.log(`[CRON] Cleaning up sermons at ${new Date().toLocaleTimeString()}`);

//   try {
//     const result = await Sermon.deleteMany({
//       $or: [
//         {
//           status: 'End',
//           adminStaffUserId: { $in: [null, undefined] },
//           churchId: { $in: [null, undefined] }
//         },
//         {
//           sermonName: { $exists: true },
//           adminStaffUserId: { $in: [null, undefined] },
//           churchId: { $in: [null, undefined] },
//           startDateTime: { $in: [null, undefined] },
//           endDateTime: { $in: [null, undefined] },
//           $or: [
//             { status: { $in: [null, undefined] } },
//             { status: { $exists: false } }
//           ]
//         },
//         {
//           status: { $exists: false }
//         }
//       ]
//     });

//     console.log(`[CRON] Deleted ${result.deletedCount} unwanted sermon(s).`);
//   } catch (error) {
//     console.error('[CRON] Error:', error.message);
//   }
// });







export const convertSermonDates = async (req, res) => {
  try {
    // Get all sermons
    const sermons = await Sermon.find({}).lean();
    console.log(`Found ${sermons.length} total sermons to process`);

    let convertedCount = 0;
    let logSamples = 0;

    // Process each sermon
    for (const sermon of sermons) {
      // Log some sample data to understand the structure
      if (logSamples < 3) {
        console.log('Sample sermon data:');
        console.log('ID:', sermon._id);
        console.log('startDateTime type:', typeof sermon.startDateTime);
        console.log('startDateTime value:', sermon.startDateTime);
        console.log('endDateTime type:', typeof sermon.endDateTime);
        console.log('endDateTime value:', sermon.endDateTime);
        logSamples++;
      }

      let needsUpdate = false;

      // Check if startDateTime is in ISO format (contains T)
      if (sermon.startDateTime &&
        (typeof sermon.startDateTime === 'string' && sermon.startDateTime.includes('T')) ||
        (typeof sermon.startDateTime === 'object' && sermon.startDateTime instanceof Date)) {

        try {
          const dateObj = new Date(sermon.startDateTime);
          if (!isNaN(dateObj.getTime())) { // Ensure it's a valid date
            const formattedDate = formatDateToString(dateObj);

            // Update the document directly in the database
            await Sermon.updateOne(
              { _id: sermon._id },
              { $set: { startDateTime: formattedDate } }
            );

            needsUpdate = true;
            console.log(`Converted startDateTime for sermon ${sermon._id} from ${sermon.startDateTime} to ${formattedDate}`);
          }
        } catch (err) {
          console.error(`Error processing startDateTime for sermon ${sermon._id}:`, err);
        }
      }

      // Check if endDateTime is in ISO format (contains T)
      if (sermon.endDateTime &&
        (typeof sermon.endDateTime === 'string' && sermon.endDateTime.includes('T')) ||
        (typeof sermon.endDateTime === 'object' && sermon.endDateTime instanceof Date)) {

        try {
          const dateObj = new Date(sermon.endDateTime);
          if (!isNaN(dateObj.getTime())) { // Ensure it's a valid date
            const formattedDate = formatDateToString(dateObj);

            // Update the document directly in the database
            await Sermon.updateOne(
              { _id: sermon._id },
              { $set: { endDateTime: formattedDate } }
            );

            needsUpdate = true;
            console.log(`Converted endDateTime for sermon ${sermon._id} from ${sermon.endDateTime} to ${formattedDate}`);
          }
        } catch (err) {
          console.error(`Error processing endDateTime for sermon ${sermon._id}:`, err);
        }
      }

      if (needsUpdate) {
        convertedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully converted dates for ${convertedCount} sermons`,
      totalProcessed: sermons.length
    });

  } catch (error) {
    console.error('Error converting sermon dates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to convert sermon dates',
      error: error.message
    });
  }
};

/**
 * Helper function to format a Date object to string in "YYYY-MM-DD HH:MM:SS" format
 */
function formatDateToString(date) {
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
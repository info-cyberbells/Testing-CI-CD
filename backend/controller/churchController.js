import mongoose from 'mongoose';
import cron from 'node-cron';
import Sermon from '../model/sermonModel.js';
import JesusClick from '../model/jeasusClicked.js';
import User from '../model/authModel.js';
import Church from '../model/churchModel.js';
import VoiceProfile from '../model/voiceProfileModel.js';
import UserListen from '../model/usersListen.js'
import Event from '../model/eventModel.js';
import moment from 'moment-timezone';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'churchProfile');
const BASE_URL = '/churchProfile/';


const resetWeeklyLimits = async () => {
  try {
    const now = new Date();
    const expiredChurches = await Church.find({
      stream_reset_date: { $lte: now }
    });

    for (let church of expiredChurches) {
      church.stream_used_minutes = 0;
      church.stream_reset_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await church.save();
      console.log(`Reset church: ${church.name}`);
    }
  } catch (error) {
    console.error('Reset error:', error);
  }
};


const sortLanguages = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [...arr]
    .filter(item => item)
    .sort((a, b) => {
      const strA = typeof a === 'string' ? a : (a?.name || a?.language || String(a));
      const strB = typeof b === 'string' ? b : (b?.name || b?.language || String(b));
      return strA.localeCompare(strB);
    });
};


export const addChurch = async (req, res) => {
  try {
    const {
      name,
      address,
      contact_no,
      senior_pastor_name,
      senior_pastor_phone_number,
      city,
      state,
      country,
      api_key,
      image,
      speech_key,
      latitude,
      longitude,
      speech_location,
      translator_key,
      translator_location,
      translator_endpoint,
      stream_limit_minutes,
    } = req.body;

    const existingChurch = await Church.findOne({ name });
    if (existingChurch) {
      return res.status(400).json({ error: 'Church already exists' });
    }

    let imagePath = null;
    if (image) {
      const uniqueId = Date.now().toString();
      const imageResult = await handleChurchBase64Image(image, uniqueId);
      if (imageResult.error) {
        return res.status(400).json({ message: imageResult.message });
      }
      imagePath = imageResult.imagePath;
    }

    // Handle language settings - use frontend languages OR auto-populate all
    let finalLanguageSettings;

    if (req.body.languageSettings) {
      // Frontend sent specific languages - use them
      finalLanguageSettings = req.body.languageSettings;
    } else {
      // No languages from frontend - auto-populate with all available languages
      let availableLanguages = [];
      try {
        availableLanguages = await VoiceProfile.find({});
      } catch (error) {
        console.error("Error fetching VoiceProfile languages:", error);
        availableLanguages = [];
      }

      const allLanguageSettings = {
        goLive: { male: [], female: [] },
        joinLive: { male: [], female: [] }
      };

      if (availableLanguages.length > 0) {
        availableLanguages.forEach(language => {
          if (language.genderVoices?.male?.length > 0) {
            language.genderVoices.male.forEach(voiceId => {
              allLanguageSettings.goLive.male.push({
                id: voiceId,
                language: language.voiceName
              });
              allLanguageSettings.joinLive.male.push({
                id: voiceId,
                language: language.voiceName
              });
            });
          }

          if (language.genderVoices?.female?.length > 0) {
            language.genderVoices.female.forEach(voiceId => {
              allLanguageSettings.goLive.female.push({
                id: voiceId,
                language: language.voiceName
              });
              allLanguageSettings.joinLive.female.push({
                id: voiceId,
                language: language.voiceName
              });
            });
          }
        });
      }

      finalLanguageSettings = allLanguageSettings;
    }

    // Create new church
    const newChurch = new Church({
      name,
      address,
      contact_no,
      senior_pastor_name,
      senior_pastor_phone_number,
      city,
      state,
      country,
      api_key,
      image: imagePath,
      speech_key,
      speech_location,
      latitude,
      longitude,
      translator_key,
      translator_location,
      translator_endpoint: translator_endpoint || 'https://api.cognitive.microsofttranslator.com',
      languageSettings: finalLanguageSettings,
      stream_limit_minutes,
      stream_used_minutes: 0,
      stream_reset_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Fallback safety (can be removed if schema is stable)
    if (!newChurch.languageSettings && finalLanguageSettings) {
      newChurch.languageSettings = finalLanguageSettings;
    }

    await newChurch.save();

    const fullUrl = req.protocol + '://' + req.get('host');
    const imageFullPath = newChurch.image ? `${fullUrl}${newChurch.image}` : null;

    const churchResponse = {
      _id: newChurch._id,
      name: newChurch.name,
      address: newChurch.address,
      contact_no: newChurch.contact_no,
      senior_pastor_name: newChurch.senior_pastor_name,
      senior_pastor_phone_number: newChurch.senior_pastor_phone_number,
      city: newChurch.city,
      state: newChurch.state,
      country: newChurch.country,
      api_key: newChurch.api_key,
      image: imageFullPath,
      speech_key: newChurch.speech_key,
      latitude: newChurch.latitude,
      longitude: newChurch.longitude,
      speech_location: newChurch.speech_location,
      translator_key: newChurch.translator_key,
      translator_location: newChurch.translator_location,
      translator_endpoint: newChurch.translator_endpoint,
      languageSettings: newChurch.languageSettings,
      stream_limit_minutes: newChurch.stream_limit_minutes,
      stream_reset_date: newChurch.stream_reset_date,
      createdAt: newChurch.createdAt
    };

    res.status(201).json({ message: 'Church registered successfully', church: churchResponse });
  } catch (error) {
    console.error("Add Church Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Helper function to construct full image URL
const getFullImageUrl = (baseUrl, imagePath) => {
  try {
    if (!imagePath) return null;

    // Remove any leading double slashes
    const cleanImagePath = imagePath.replace(/^\/+/, '');
    const fullUrl = `${baseUrl}/${cleanImagePath}`;

    // Validate URL format
    new URL(fullUrl);
    return fullUrl;
  } catch (error) {
    console.error("Error constructing image URL:", error);
    return null;
  }
};


export const fetchAllChurch = async (req, res) => {
  try {
    const { exclude } = req.query;

    let churches;

    if (exclude === 'true') {
      churches = await Church.find()
        .select('-translator_key -translator_location -speech_key -speech_location -languageSettings -translator_endpoint')
        .sort({ createdAt: -1 });
    } else {
      churches = await Church.find().sort({ createdAt: -1 });
    }

    const baseUrl = req.protocol + '://' + req.get('host');

    const churchesWithFullImageUrls = churches.map(church => {
      const churchObj = church.toObject();
      const fullImageUrl = getFullImageUrl(baseUrl, churchObj.image);
      return {
        ...churchObj,
        image: fullImageUrl
      };
    });

    // Log the first church for verification
    if (churchesWithFullImageUrls.length > 0) {
      console.log("Sample church with image URL:", {
        name: churchesWithFullImageUrls[0].name,
        imageUrl: churchesWithFullImageUrls[0].image,
        excludedSensitiveFields: exclude === 'true'
      });
    }

    res.status(200).json(churchesWithFullImageUrls);
  } catch (error) {
    console.error("Error fetching churches:", error);
    res.status(400).json({
      error: error.message,
      details: "Failed to fetch churches with images"
    });
  }
};


export const getChurchLanguages = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // goLive or joinLive

    if (!type || !["goLive", "joinLive"].includes(type)) {
      return res.status(400).json({ error: "Query param 'type' must be 'goLive' or 'joinLive'" });
    }

    const church = await Church.findById(id).select("languageSettings name");

    if (!church) {
      return res.status(404).json({ error: "Church not found" });
    }

    const selectedLanguages = church.languageSettings?.[type] || { male: [], female: [] };

    res.status(200).json({
      churchId: church._id,
      churchName: church.name,
      type,
      languages: selectedLanguages
    });
  } catch (error) {
    console.error("Error fetching church language settings:", error);
    res.status(400).json({
      error: error.message,
      message: "Failed to fetch church language settings"
    });
  }
};



export const detailChurch = async (req, res) => {
  try {
    const { id } = req.params;
    const { languages } = req.query; // Check for ?languages=goLive or ?languages=joinLive or ?languages=true

    const church = await Church.findById(id);

    if (!church) {
      return res.status(404).json({ error: 'Church not found' });
    }
    if (languages) {
      const baseResponse = {
        _id: church._id,
        name: church.name
      };

      if (languages === 'goLive') {
        const goLiveSettings = church.languageSettings?.goLive || { male: [], female: [] };

        return res.status(200).json({
          ...baseResponse,
          languageSettings: {
            goLive: {
              male: sortLanguages(goLiveSettings.male),
              female: sortLanguages(goLiveSettings.female)
            }
          }
        });
      }

      if (languages === 'joinLive') {
        const userId = req.query.userId || req.user?._id || req.userId;
        let lastSelectedLanguage = null;

        if (userId) {
          const lastListen = await UserListen.findOne({
            userId: userId,
            churchId: id,
            selectedLanguage: { $exists: true }
          })
            .sort({ createdAt: -1 })
            .select('selectedLanguage')
            .lean();


          if (lastListen) {
            lastSelectedLanguage = lastListen.selectedLanguage;
          } else {
            console.log('DEBUG - No previous language found');
          }
        } else {
          console.log('DEBUG - No userId provided');
        }

        const joinLiveSettings = church.languageSettings?.joinLive || { male: [], female: [] };

        return res.status(200).json({
          ...baseResponse,
          languageSettings: {
            joinLive: {
              male: sortLanguages(joinLiveSettings.male),
              female: sortLanguages(joinLiveSettings.female)
            }
          },
          lastSelectedLanguage
        });
      }
      if (languages === 'true' || languages === '1') {
        return res.status(200).json({
          ...baseResponse,
          languageSettings: {
            goLive: {
              male: sortLanguages(settings.goLive?.male),
              female: sortLanguages(settings.goLive?.female)
            },
            joinLive: {
              male: sortLanguages(settings.joinLive?.male),
              female: sortLanguages(settings.joinLive?.female)
            }
          }
        });
      }
    }
    const baseUrl = req.protocol + '://' + req.get('host');
    const churchData = church.toObject();

    const fullImageUrl = getFullImageUrl(baseUrl, churchData.image);
    churchData.image = fullImageUrl;
    churchData.imageUrl = fullImageUrl;

    res.status(200).json(churchData);
  } catch (error) {
    console.error("Error fetching church details:", error);
    res.status(400).json({
      error: error.message,
      details: "Failed to fetch church details"
    });
  }
};



export const countAllChurches = async (req, res) => {
  try {
    const count = await Church.countDocuments(); // Count all churches
    res.status(200).json({ total: count }); // Return the total count in the response
  } catch (error) {
    res.status(500).json({ error: error.message }); // Handle errors
  }
};


export const fetchUserType = async (req, res) => {
  try {
    const userType = req.params.type;
    const users = await User.find({ type: userType });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Handle Base64 Image Function for Church
const handleChurchBase64Image = async (imageBase64, churchId) => {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.error("Invalid base64 string format.");
      return { error: true, message: "Invalid base64 string" };
    }

    const imageType = matches[1];
    const base64Data = matches[2];
    const imageFileName = `church_${churchId}_${Date.now()}.${imageType}`;
    const imagePath = path.join(uploadDir, imageFileName);

    try {
      fs.writeFileSync(imagePath, base64Data, "base64");
      const newImagePath = `${BASE_URL}${imageFileName}`;
      console.log("New image path for database:", newImagePath);
      return { imagePath: newImagePath };
    } catch (error) {
      console.error("Error writing the church image file:", error);
      return { error: true, message: "Failed to save church image." };
    }
  } catch (error) {
    console.error("Error in handleChurchBase64Image:", error);
    return { error: true, message: "Failed to process church image." };
  }
};

// Updated updateChurch controller
// export const updateChurch = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateFields = { ...req.body };

//     console.log("Original Request Body:", req.body);

//     // Handle image if provided
//     if (updateFields.image) {
//       const imageResult = await handleChurchBase64Image(updateFields.image, id);
//       if (imageResult.error) {
//         return res.status(400).json({ message: imageResult.message });
//       }

//       // Store the image path in updateFields
//       updateFields.image = imageResult.imagePath;
//       console.log("Image path to be saved:", updateFields.image);
//     }

//     // Update church in database with explicit image field
//     const updatedChurch = await Church.findByIdAndUpdate(
//       id,
//       {
//         $set: {
//           name: updateFields.name,
//           address: updateFields.address,
//           contact_no: updateFields.contact_no,
//           city: updateFields.city,
//           state: updateFields.state,
//           country: updateFields.country,
//           senior_pastor_name: updateFields.senior_pastor_name,
//           senior_pastor_phone_number: updateFields.senior_pastor_phone_number,
//           api_key: updateFields.api_key,
//           image: updateFields.image, // Explicitly set the image field
//           translator_key: updateFields.translator_key,
//           translator_endpoint: updateFields.translator_endpoint,
//           translator_location: updateFields.translator_location,
//           speech_key: updateFields.speech_key,
//           speech_location: updateFields.speech_location,
//         }
//       },
//       { new: true, runValidators: true }
//     );
//     console.log("Update Fields Being Sent to DB:", updateFields);
//     if (!updatedChurch) {
//       return res.status(404).json({ message: 'Church not found' });
//     }

//     // Log the updated church object
//     console.log("Updated Church in DB:", updatedChurch);

//     // Construct full image URL for response
//     const fullUrl = req.protocol + '://' + req.get('host');
//     const imageFullPath = updatedChurch.image ? `${fullUrl}${updatedChurch.image}` : null;

//     // Send response with updated church data
//     res.status(200).json({
//       message: 'Church updated successfully',
//       church: {
//         ...updatedChurch.toObject(),
//         image: imageFullPath
//       }
//     });

//   } catch (error) {
//     console.error("Update Church Error:", error);
//     res.status(400).json({ error: error.message });
//   }
// };


export const updateChurch = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = { ...req.body };

    console.log("Original Request Body:", req.body);

    // Handle image if provided
    if (updateFields.image) {
      const imageResult = await handleChurchBase64Image(updateFields.image, id);
      if (imageResult.error) {
        return res.status(400).json({ message: imageResult.message });
      }
      updateFields.image = imageResult.imagePath;
      console.log("Image path to be saved:", updateFields.image);
    }

    // Build the update object
    const updateData = {
      name: updateFields.name,
      address: updateFields.address,
      contact_no: updateFields.contact_no,
      city: updateFields.city,
      state: updateFields.state,
      country: updateFields.country,
      latitude: updateFields.latitude,
      longitude: updateFields.longitude,
      senior_pastor_name: updateFields.senior_pastor_name,
      senior_pastor_phone_number: updateFields.senior_pastor_phone_number,
      api_key: updateFields.api_key,
      image: updateFields.image,
      translator_key: updateFields.translator_key,
      translator_endpoint: updateFields.translator_endpoint,
      translator_location: updateFields.translator_location,
      speech_key: updateFields.speech_key,
      speech_location: updateFields.speech_location,
      stream_limit_minutes: updateFields.stream_limit_minutes,
      stream_used_minutes: updateFields.stream_used_minutes,
      stream_reset_date: updateFields.stream_reset_date
    };

    // ✅ Add languageSettings if it exists in the request
    if (updateFields.languageSettings) {
      updateData.languageSettings = updateFields.languageSettings;
    }

    if (updateFields.stream_limit_minutes !== undefined) {
      updateData.stream_reset_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      updateData.stream_used_minutes = 0;
    }

    const updatedChurch = await Church.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedChurch) {
      return res.status(404).json({ message: 'Church not found' });
    }

    const fullUrl = req.protocol + '://' + req.get('host');
    const imageFullPath = updatedChurch.image ? `${fullUrl}${updatedChurch.image}` : null;

    // ✅ Return updatedChurch with full image path and updated languageSettings
    res.status(200).json({
      message: 'Church updated successfully',
      church: {
        ...updatedChurch.toObject(),
        image: imageFullPath,
        languageSettings: updatedChurch.languageSettings
      }
    });

  } catch (error) {
    console.error("Update Church Error:", error);
    res.status(400).json({ error: error.message });
  }
};


// Delete Church by ID
export const deleteChurch = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedChurch = await Church.findByIdAndDelete(id);

    if (!deletedChurch) {
      return res.status(404).json({ error: 'Church not found' });
    }

    res.status(200).json({ message: 'Church deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// export const getChurchStats = async (req, res) => {
//   try {
//     const { churchId, startDate, endDate, period } = req.query;

//     let start, end;

//     if (period) {
//       const nowACST = moment().tz('Australia/Adelaide');
//       console.log('Current Australia/Adelaide time:', nowACST.format('YYYY-MM-DD HH:mm:ss'));

//       switch (period.toLowerCase()) {
//         case 'today':
//           start = nowACST.clone().startOf('day').toDate();
//           end = nowACST.clone().endOf('day').toDate();
//           break;
//         case 'week':
//           start = nowACST.clone().startOf('week').toDate();
//           end = nowACST.clone().endOf('week').toDate();
//           break;
//         case 'month':
//           start = nowACST.clone().startOf('month').toDate();
//           end = nowACST.clone().endOf('month').toDate();
//           break;
//         case 'year':
//           start = nowACST.clone().startOf('year').toDate();
//           end = nowACST.clone().endOf('year').toDate();
//           break;
//         default:
//           return res.status(400).json({ message: "Invalid period. Use: today, week, month, year" });
//       }
//     } else {
//       if (!startDate || !endDate) {
//         return res.status(400).json({ message: "startDate and endDate are required when period is not specified" });
//       }
//       // Convert custom dates to Australia/Adelaide timezone
//       start = moment.tz(startDate, 'Australia/Adelaide').startOf('day').toDate();
//       end = moment.tz(endDate, 'Australia/Adelaide').endOf('day').toDate();
//     }

//     // Handle multiple church IDs (comma-separated)
//     let churchIds = [];
//     if (churchId) {
//       churchIds = churchId.split(',').map(id => new mongoose.Types.ObjectId(id.trim()));
//     }

//     console.log('Debugging stats...');
//     console.log('Australia/Adelaide date range:',
//       moment(start).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
//       'to',
//       moment(end).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss')
//     );
//     console.log('Church IDs:', churchIds);

//     // 1️⃣ Total sermons with at least one user
//     const totalSermonsResult = await Sermon.aggregate([
//       {
//         $lookup: {
//           from: 'usersListen',
//           localField: '_id',
//           foreignField: 'sermonId',
//           as: 'listeners'
//         }
//       },
//       {
//         $match: {
//           'listeners.0': { $exists: true } // Only include sermons with at least one listener
//         }
//       },
//       {
//         $count: 'totalCount'
//       }
//     ]);
//     const totalSermons = totalSermonsResult.length > 0 ? totalSermonsResult[0].totalCount : 0;


//     //2
//     const allSalvations = await JesusClick.find({
//       // { isReferred: true },
//     });

//     const uniqueUserIds = [...new Set(allSalvations.map(s => s.userId.toString()))];
//     const salvationsCount = uniqueUserIds.length;
//     console.log('Total salvations (all churches, all time):', salvationsCount);


//     // 3️⃣ Total users (always return ALL users, NO filters)
//     const totalUsers = await User.countDocuments();


//     // 4️⃣ Total churches (always return ALL churches count)
//     const totalChurches = await Church.countDocuments();

//     const totalStaff = await User.countDocuments({ type: '3' });

//     const totalEvents = await Event.countDocuments({
//       ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
//     });

//     // 5️⃣ Active Users per Church (based on selected date range)
//     const getActiveUsersByChurch = async (startDate, endDate) => {
//       return await User.aggregate([
//         {
//           $match: {
//             lastActive: { $gte: startDate, $lte: endDate },
//             churchId: { $exists: true, $ne: null },
//             ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
//           }
//         },
//         {
//           $lookup: {
//             from: 'church',
//             localField: 'churchId',
//             foreignField: '_id',
//             as: 'church'
//           }
//         },
//         {
//           $unwind: '$church'
//         },
//         {
//           $group: {
//             _id: {
//               churchId: '$churchId',
//               churchName: '$church.name',
//               userId: '$_id'
//             }
//           }
//         },
//         {
//           $group: {
//             _id: {
//               churchId: '$_id.churchId',
//               churchName: '$_id.churchName'
//             },
//             activeUsers: { $sum: 1 }
//           }
//         },
//         {
//           $sort: { activeUsers: -1 }
//         }
//       ]);
//     };

//     // Get active users for the selected date range
//     const activeUsersResult = await getActiveUsersByChurch(start, end);

//     // Format results
//     const activeUsersByChurch = activeUsersResult.reduce((acc, item) => {
//       acc[item._id.churchName || 'Unknown Church'] = item.activeUsers;
//       return acc;
//     }, {});

//     console.log('Active users by church for selected period:', activeUsersByChurch);


//     // 6️⃣ New users (users created in date range + church filter)
//     const newUserFilter = {
//       created_at: { $gte: start, $lte: end },
//       ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
//     };
//     const newUsers = await User.countDocuments(newUserFilter);

//     // 7️⃣ New salvations (salvations in date range + church filter)
//     let newSalvationsCount = 0;
//     if (churchIds.length > 0) {
//       // Get users from specified churches
//       const churchUsers = await User.find({
//         churchId: { $in: churchIds }
//       });

//       // Get salvations for users in these churches within date range
//       const newChurchSalvations = await JesusClick.find({
//         // isReferred: true,
//         createdAt: { $gte: start, $lte: end },
//         userId: { $in: churchUsers.map(u => u._id) }
//       });

//       // Count unique users (one salvation per user)
//       const newUniqueUserIds = [...new Set(newChurchSalvations.map(s => s.userId.toString()))];
//       newSalvationsCount = newUniqueUserIds.length;

//     } else {
//       // For all churches, get salvations in date range
//       const newAllSalvations = await JesusClick.find({
//         // isReferred: true,
//         createdAt: { $gte: start, $lte: end }
//       });
//       // Count unique users
//       const newUniqueUserIds = [...new Set(newAllSalvations.map(s => s.userId.toString()))];
//       newSalvationsCount = newUniqueUserIds.length;
//     }

//     // 8️⃣ New sermons (sermons in date range + church filter)
//     const newSermonsResult = await Sermon.aggregate([
//       {
//         $match: {
//           status: "End",
//           startDateTime: { $exists: true, $ne: null, $ne: "" },
//           endDateTime: { $exists: true, $ne: null, $ne: "" },
//           churchId: { $exists: true, $ne: null },
//           $expr: {
//             $and: [
//               {
//                 $gte: [
//                   { $dateFromString: { dateString: "$startDateTime" } },
//                   start
//                 ]
//               },
//               {
//                 $lte: [
//                   { $dateFromString: { dateString: "$startDateTime" } },
//                   end
//                 ]
//               }
//             ]
//           },
//           ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
//         }
//       },
//       {
//         $lookup: {
//           from: 'usersListen',
//           localField: '_id',
//           foreignField: 'sermonId',
//           as: 'listeners'
//         }
//       },
//       {
//         $match: {
//           'listeners.0': { $exists: true } // Only include sermons with at least one listener
//         }
//       },
//       {
//         $count: 'totalCount'
//       }
//     ]);
//     const newSermons = newSermonsResult.length > 0 ? newSermonsResult[0].totalCount : 0;


//     // 9️⃣ Faith Level Stats (with date range + church filter)
//     const allFaithLevels = [
//       'No faith',
//       'Uncertain',
//       'Open to faith',
//       'Actively Exploring',
//       'Strong faith'
//     ];

//     const faithUserFilter = {
//       faithLevel: { $exists: true, $ne: null, $ne: "" },
//       created_at: { $gte: start, $lte: end },
//       ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
//     };

//     const totalFaithUsers = await User.countDocuments(faithUserFilter);

//     let faithLevelStats = {};
//     if (totalFaithUsers === 0) {
//       allFaithLevels.forEach(level => {
//         faithLevelStats[level] = "0.00%";
//       });
//     } else {
//       const faithLevels = await User.aggregate([
//         { $match: faithUserFilter },
//         {
//           $group: {
//             _id: "$faithLevel",
//             count: { $sum: 1 }
//           }
//         }
//       ]);


//       const faithLevelMap = new Map();
//       faithLevels.forEach(item => {
//         const label = item._id.trim();
//         faithLevelMap.set(label, item.count);
//       });

//       const rawPercentages = [];
//       allFaithLevels.forEach(level => {
//         const count = faithLevelMap.get(level) || 0;
//         const percentage = (count / totalFaithUsers) * 100;
//         rawPercentages.push({ level, percentage });
//       });


//       let totalRounded = 0;
//       for (let i = 0; i < rawPercentages.length; i++) {
//         if (i === rawPercentages.length - 1) {
//           const lastPercentage = 100 - totalRounded;
//           faithLevelStats[rawPercentages[i].level] = lastPercentage.toFixed(2) + "%";
//         } else {
//           const rounded = parseFloat(rawPercentages[i].percentage.toFixed(2));
//           faithLevelStats[rawPercentages[i].level] = rounded.toFixed(2) + "%";
//           totalRounded += rounded;
//         }
//       }
//     }

//     // 🔟 Monthly User Breakdown (for all date ranges) - Church-wise
//     let monthlyBreakdown = null;

//     console.log('Calculating monthly breakdown for date range:', start, 'to', end);

//     const monthlyUsers = await User.aggregate([
//       {
//         $match: {
//           created_at: { $gte: start, $lte: end },
//           churchId: { $exists: true, $ne: null }, // Only users with church
//           ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
//         }
//       },
//       {
//         $lookup: {
//           from: 'church',
//           localField: 'churchId',
//           foreignField: '_id',
//           as: 'church'
//         }
//       },
//       {
//         $unwind: '$church'
//       },
//       {
//         $addFields: {
//           year: { $year: "$created_at" },
//           month: { $month: "$created_at" }
//         }
//       },
//       {
//         $group: period === 'year' ? {
//           _id: {
//             year: "$year",
//             churchId: "$churchId",
//             churchName: "$church.name"
//           },
//           count: { $sum: 1 },
//           users: { $push: { firstName: "$firstName", lastName: "$lastName", created_at: "$created_at" } }
//         } : {
//           _id: {
//             year: "$year",
//             month: "$month",
//             churchId: "$churchId",
//             churchName: "$church.name"
//           },
//           count: { $sum: 1 },
//           users: { $push: { firstName: "$firstName", lastName: "$lastName", created_at: "$created_at" } }
//         }
//       },
//       {
//         $sort: period === 'year' ?
//           { "_id.year": 1, "_id.churchName": 1 } :
//           { "_id.year": 1, "_id.month": 1, "_id.churchName": 1 }
//       }
//     ]);

//     //11th

//     const languages = ["english", "portuguese", "mandarin", "spanish", "indonesian"];


//     // Aggregate actual stats
//     const aggregatedStats = await User.aggregate([
//       {
//         $match: {
//           language: { $in: languages },
//           ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
//         }
//       },
//       {
//         $group: {
//           _id: "$language",
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     // Convert to { language: "x.xx%" } format
//     let languageStats = {};
//     languages.forEach(lang => {
//       const found = aggregatedStats.find(item => item._id === lang);
//       const count = found ? found.count : 0;
//       const percentage = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(2) : "0.00";
//       languageStats[lang.charAt(0).toUpperCase() + lang.slice(1)] = `${percentage}%`;
//     });


//     console.log('Monthly aggregation result:', monthlyUsers);

//     if (monthlyUsers.length > 0) {
//       monthlyBreakdown = monthlyUsers.map(item => {
//         if (period === 'year') {
//           return {
//             year: item._id.year,
//             churchId: item._id.churchId,
//             churchName: item._id.churchName || 'Unknown Church',
//             count: item.count,
//             period: `${item._id.year}`,
//             monthName: `${item._id.year}`, 
//             month: null
//           };
//         } else {
//           const monthName = moment().month(item._id.month - 1).format('MMMM');
//           return {
//             year: item._id.year,
//             month: item._id.month,
//             monthName: monthName,
//             churchId: item._id.churchId,
//             churchName: item._id.churchName || 'Unknown Church',
//             count: item.count,
//             period: `${moment().month(item._id.month - 1).format('MMM')} ${item._id.year}`,
//           };
//         }
//       });
//     }

//     //12th one
//     const referralSources = ["friend_family", "church_event", "social_media", "community_outreach", "online_search", "flyer_poster"];

//     // Aggregate actual referral source stats
//     const aggregatedReferralStats = await User.aggregate([
//       {
//         $match: {
//           referralSource: { $in: referralSources },
//           ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
//         }
//       },
//       {
//         $group: {
//           _id: "$referralSource",
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     // Convert to { referralSource: "x.xx%" } format
//     let referralSourceStats = {};
//     referralSources.forEach(source => {
//       const found = aggregatedReferralStats.find(item => item._id === source);
//       const count = found ? found.count : 0;
//       const percentage = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(2) : "0.00";
//       // Convert snake_case to readable format
//       const readableSource = source.split('_').map(word =>
//         word.charAt(0).toUpperCase() + word.slice(1)
//       ).join(' ');
//       referralSourceStats[readableSource] = `${percentage}%`;
//     });


//     //13th - Users by Language per Country
//     const languagesByCountry = await User.aggregate([
//       {
//         $match: {
//           ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
//         }
//       },
//       {
//         $lookup: {
//           from: 'church', // Changed from 'churches' to 'church'
//           localField: 'churchId',
//           foreignField: '_id',
//           as: 'church'
//         }
//       },
//       {
//         $unwind: '$church'
//       },
//       {
//         $match: {
//           language: { $exists: true, $ne: null, $ne: "" },
//           'church.country': { $exists: true, $ne: null, $ne: "" }
//         }
//       },
//       {
//         $group: {
//           _id: {
//             country: '$church.country',
//             language: '$language'
//           },
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $sort: { '_id.country': 1, '_id.language': 1 }
//       }
//     ]);

//     console.log('Raw aggregation result:', languagesByCountry);

//     // Format the results by country
//     const languagesByCountryFormatted = {};
//     const allLanguages = ["english", "portuguese", "mandarin", "spanish", "indonesian"];

//     // Initialize all countries with 0 counts for all languages
//     languagesByCountry.forEach(item => {
//       const country = item._id.country;
//       if (!languagesByCountryFormatted[country]) {
//         languagesByCountryFormatted[country] = {};
//         allLanguages.forEach(lang => {
//           languagesByCountryFormatted[country][lang.charAt(0).toUpperCase() + lang.slice(1)] = 0;
//         });
//       }
//     });

//     // Fill in actual counts
//     languagesByCountry.forEach(item => {
//       const country = item._id.country;
//       const language = item._id.language;
//       const formattedLanguage = language.charAt(0).toUpperCase() + language.slice(1);

//       if (languagesByCountryFormatted[country]) {
//         languagesByCountryFormatted[country][formattedLanguage] = item.count;
//       }
//     });

//     console.log('Final formatted result:', languagesByCountryFormatted);


//     console.log('Final monthly breakdown:', monthlyBreakdown);


//     if (newUsers === 0) {
//       const totalUsersInChurch = churchIds.length > 0
//         ? await User.countDocuments({ churchId: { $in: churchIds } })
//         : await User.countDocuments();
//       console.log(`Total users in church (all time): ${totalUsersInChurch}`);
//     }


//     //14th - Average Sermon Running Time per Church
//     const averageSermonDuration = await Sermon.aggregate([
//       {
//         $match: {
//           status: "End", // Only completed sermons
//           startDateTime: { $exists: true, $ne: null, $ne: "" },
//           endDateTime: { $exists: true, $ne: null, $ne: "" },
//           churchId: { $exists: true, $ne: null },
//           ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {}),
//           // Filter by date range using startDateTime
//           $expr: {
//             $and: [
//               {
//                 $gte: [
//                   { $dateFromString: { dateString: "$startDateTime" } },
//                   start
//                 ]
//               },
//               {
//                 $lte: [
//                   { $dateFromString: { dateString: "$startDateTime" } },
//                   end
//                 ]
//               }
//             ]
//           }
//         }
//       },
//       {
//         $lookup: {
//           from: 'church',
//           localField: 'churchId',
//           foreignField: '_id',
//           as: 'church'
//         }
//       },
//       {
//         $lookup: {
//           from: 'usersListen',
//           localField: '_id',
//           foreignField: 'sermonId',
//           as: 'listeners'
//         }
//       },
//       {
//         $unwind: '$church'
//       },
//       {
//         $addFields: {
//           // Calculate duration in minutes
//           durationMinutes: {
//             $divide: [
//               {
//                 $subtract: [
//                   { $dateFromString: { dateString: "$endDateTime" } },
//                   { $dateFromString: { dateString: "$startDateTime" } }
//                 ]
//               },
//               60000 // Convert milliseconds to minutes
//             ]
//           },
//           uniqueListeners: {
//             $size: {
//               $setUnion: [
//                 {
//                   $map: {
//                     input: "$listeners",
//                     as: "listener",
//                     in: "$$listener.userId"
//                   }
//                 },
//                 []
//               ]
//             }
//           }
//         }
//       },
//       {
//         $match: {
//           durationMinutes: { $gt: 0, $lt: 600 } // Filter out invalid durations (0-10 hours)
//         }
//       },
//       {
//         $group: {
//           _id: {
//             churchId: '$churchId',
//             churchName: '$church.name'
//           },
//           averageDuration: { $avg: '$durationMinutes' },
//           averageUsers: { $avg: '$uniqueListeners' },
//           totalSermons: { $sum: 1 },
//           totalDuration: { $sum: '$durationMinutes' }
//         }
//       },
//       {
//         $sort: { averageDuration: -1 }
//       }
//     ]);

//     // Format average sermon duration results
//     const averageSermonDurationFormatted = {};
//     averageSermonDuration.forEach(item => {
//       const churchName = item._id.churchName || 'Unknown Church';
//       const avgMinutes = Math.round(item.averageDuration);
//       const hours = Math.floor(avgMinutes / 60);
//       const minutes = avgMinutes % 60;

//       let formattedDuration;
//       if (hours > 0) {
//         formattedDuration = `${hours}h ${minutes}m`;
//       } else {
//         formattedDuration = `${minutes}m`;
//       }

//       averageSermonDurationFormatted[churchName] = {
//         averageDuration: formattedDuration,
//         averageMinutes: avgMinutes,
//         averageUsers: Math.round(item.averageUsers || 0),
//         totalSermons: item.totalSermons,
//         totalHours: Math.round(item.totalDuration / 60 * 10) / 10
//       };
//     });

//     console.log('Average sermon duration by church:', averageSermonDurationFormatted);

//     res.json({
//       totalSermons,
//       totalSalvations: salvationsCount,
//       totalUsers,
//       totalChurches,
//       newUsers,
//       totalStaff,
//       totalEvents,
//       newSalvations: newSalvationsCount,
//       activeUsersByChurch,
//       newSermons,
//       faithLevelStats,
//       monthlyBreakdown,
//       languageStats,
//       averageSermonDuration: averageSermonDurationFormatted,
//       referralSourceStats,
//       languagesByCountry: languagesByCountryFormatted, // Add this line

//       dateRange: {
//         start: moment(start).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
//         end: moment(end).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
//         timezone: 'Australia/Adelaide'
//       }
//     });

//   } catch (error) {
//     console.error("Error getting church stats:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


export const getChurchStats = async (req, res) => {
  try {
    const { churchId, startDate, endDate, period } = req.query;

    let start, end;

    if (period) {
      const nowACST = moment().tz('Australia/Adelaide');
      console.log('Current Australia/Adelaide time:', nowACST.format('YYYY-MM-DD HH:mm:ss'));

      switch (period.toLowerCase()) {
        case 'today':
          start = nowACST.clone().startOf('day').toDate();
          end = nowACST.clone().endOf('day').toDate();
          break;
        case 'week':
          start = nowACST.clone().startOf('week').toDate();
          end = nowACST.clone().endOf('week').toDate();
          break;
        case 'month':
          start = nowACST.clone().startOf('month').toDate();
          end = nowACST.clone().endOf('month').toDate();
          break;
        case 'year':
          start = nowACST.clone().startOf('year').toDate();
          end = nowACST.clone().endOf('year').toDate();
          break;
        default:
          return res.status(400).json({ message: "Invalid period. Use: today, week, month, year" });
      }
    } else {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required when period is not specified" });
      }
      start = moment.tz(startDate, 'Australia/Adelaide').startOf('day').toDate();
      end = moment.tz(endDate, 'Australia/Adelaide').endOf('day').toDate();
    }

    // Handle multiple church IDs (comma-separated)
    let churchIds = [];
    if (churchId) {
      churchIds = churchId.split(',').map(id => new mongoose.Types.ObjectId(id.trim()));
    }

    console.log('Debugging stats...');
    console.log('Australia/Adelaide date range:',
      moment(start).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
      'to',
      moment(end).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss')
    );
    console.log('Church IDs:', churchIds);

    const [totalUsers, totalChurches, totalStaff] = await Promise.all([
      User.aggregate([
        { $match: { type: '4' } },
        {
          $lookup: {
            from: 'church',
            localField: 'churchId',
            foreignField: '_id',
            as: 'churchDetails'
          }
        },
        {
          $match: {
            'churchDetails': { $ne: [] }
          }
        },
        { $count: "count" }
      ]).then(result => (result[0] ? result[0].count : 0)),
      Church.countDocuments(),
      User.countDocuments({ type: '3' })
    ]);

    // OPTIMIZATION: Group 2 - Basic aggregations (run in parallel)
    const [totalSermonsResult, totalSalvationsResult, totalEvents] = await Promise.all([
      Sermon.aggregate([
        {
          $lookup: {
            from: 'usersListen',
            localField: '_id',
            foreignField: 'sermonId',
            as: 'listeners'
          }
        },
        {
          $match: {
            'listeners.0': { $exists: true }
          }
        },
        {
          $count: 'totalCount'
        }
      ]),
      JesusClick.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $unwind: '$userDetails'
        },
        {
          $count: "totalCount"
        }
      ]),
      Event.countDocuments({
        ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
      })
    ]);

    const totalSermons = totalSermonsResult.length > 0 ? totalSermonsResult[0].totalCount : 0;
    const salvationsCount = totalSalvationsResult.length > 0 ? totalSalvationsResult[0].totalCount : 0;


    // Special date range for UserListen (handles timezone edge cases)
    const listenStart = moment(start).subtract(12, 'hours').toDate();
    const listenEnd = moment(end).add(12, 'hours').toDate();


    // OPTIMIZATION: Group 3 - Date/church filtered queries (run in parallel)
    const [
      newUsersResult,
      newSermonsResult,
      activeUsersResult,
      faithLevels,
      monthlyUsers,
      aggregatedStats,
      aggregatedReferralStats,
      languagesByCountry,
      averageSermonDuration,
      sermonLanguageStats
    ] = await Promise.all([
      // New users count
      User.aggregate([
        {
          $match: {
            created_at: { $gte: start, $lte: end },
            type: '4',
            ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
          }
        },
        {
          $lookup: {
            from: 'church',
            localField: 'churchId',
            foreignField: '_id',
            as: 'churchDetails'
          }
        },
        {
          $match: {
            'churchDetails': { $ne: [] }
          }
        },
        { $count: "count" }
      ]),
      // New sermons
      Sermon.aggregate([
        {
          $match: {
            status: "End",
            startDateTime: { $exists: true, $ne: null, $ne: "" },
            endDateTime: { $exists: true, $ne: null, $ne: "" },
            churchId: { $exists: true, $ne: null },
            $expr: {
              $and: [
                {
                  $gte: [
                    {
                      $dateFromString: {
                        dateString: "$startDateTime",
                        timezone: "Australia/Adelaide"
                      }
                    },
                    start
                  ]
                },
                {
                  $lte: [
                    {
                      $dateFromString: {
                        dateString: "$startDateTime",
                        timezone: "Australia/Adelaide"
                      }
                    },
                    end
                  ]
                }
              ]
            },
            ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
          }
        },
        {
          $lookup: {
            from: 'usersListen',
            localField: '_id',
            foreignField: 'sermonId',
            as: 'listeners'
          }
        },
        {
          $match: {
            'listeners.0': { $exists: true }
          }
        },
        {
          $count: 'totalCount'
        }
      ]),

      // Active users by church
      User.aggregate([
        {
          $match: {
            lastActive: { $gte: start, $lte: end },
            churchId: { $exists: true, $ne: null },
            ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
          }
        },
        {
          $lookup: {
            from: 'church',
            localField: 'churchId',
            foreignField: '_id',
            as: 'church'
          }
        },
        {
          $unwind: '$church'
        },
        {
          $group: {
            _id: {
              churchId: '$churchId',
              churchName: '$church.name',
              userId: '$_id'
            }
          }
        },
        {
          $group: {
            _id: {
              churchId: '$_id.churchId',
              churchName: '$_id.churchName'
            },
            activeUsers: { $sum: 1 }
          }
        },
        {
          $sort: { activeUsers: -1 }
        }
      ]),

      // Faith levels
      User.aggregate([
        {
          $match: {
            faithLevel: { $exists: true, $ne: null, $ne: "" },
            created_at: { $gte: start, $lte: end },
            ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
          }
        },
        {
          $group: {
            _id: "$faithLevel",
            count: { $sum: 1 }
          }
        }
      ]),

      // Monthly breakdown
      User.aggregate([
        {
          $match: {
            created_at: { $gte: start, $lte: end },
            type: '4', // Add type '4' filter to match other queries
            churchId: { $exists: true, $ne: null },
            ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
          }
        },
        {
          $lookup: {
            from: 'church',
            localField: 'churchId',
            foreignField: '_id',
            as: 'church'
          }
        },
        {
          $match: {
            'church.0': { $exists: true } // Ensures church exists
          }
        },
        {
          $unwind: '$church'
        },
        {
          $addFields: {
            year: { $year: "$created_at" },
            month: { $month: "$created_at" }
          }
        },
        {
          $group: period === 'year' ? {
            _id: {
              year: "$year",
              churchId: "$churchId",
              churchName: "$church.name"
            },
            count: { $sum: 1 },
            users: { $push: { firstName: "$firstName", lastName: "$lastName", created_at: "$created_at" } }
          } : period === 'week' ? {
            _id: {
              churchId: "$churchId",
              churchName: "$church.name"
            },
            count: { $sum: 1 },
            users: { $push: { firstName: "$firstName", lastName: "$lastName", created_at: "$created_at" } }
          } : period === 'month' ? {
            _id: {
              year: "$year",
              month: "$month",
              churchId: "$churchId",
              churchName: "$church.name"
            },
            count: { $sum: 1 },
            users: { $push: { firstName: "$firstName", lastName: "$lastName", created_at: "$created_at" } }
          } : {
            // Custom date range - group by church only (like week)
            _id: {
              churchId: "$churchId",
              churchName: "$church.name"
            },
            count: { $sum: 1 },
            users: { $push: { firstName: "$firstName", lastName: "$lastName", created_at: "$created_at" } }
          }
        },
        {
          $sort: period === 'year' ?
            { "_id.year": 1, "_id.churchName": 1 } :
            { "_id.year": 1, "_id.month": 1, "_id.churchName": 1 }
        }
      ]),

      // Language stats
      User.aggregate([
        {
          $match: {
            created_at: { $gte: start, $lte: end },
            type: '4',
            language: { $in: ["english", "portuguese", "mandarin", "spanish", "indonesian"] },
            churchId: { $exists: true, $ne: null },
            ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
          }
        },
        {
          $lookup: {
            from: 'church',
            localField: 'churchId',
            foreignField: '_id',
            as: 'churchDetails'
          }
        },
        {
          $match: {
            'churchDetails.0': { $exists: true }
          }
        },
        {
          $group: {
            _id: "$language",
            count: { $sum: 1 }
          }
        }
      ]),

      // Referral source stats
      User.aggregate([
        {
          $match: {
            created_at: { $gte: start, $lte: end },
            type: '4',
            referralSource: { $in: ["friend_family", "church_event", "social_media", "community_outreach", "online_search", "flyer_poster"] },
            churchId: { $exists: true, $ne: null },
            ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
          }
        },
        {
          $lookup: {
            from: 'church',
            localField: 'churchId',
            foreignField: '_id',
            as: 'churchDetails'
          }
        },
        {
          $match: {
            'churchDetails.0': { $exists: true }
          }
        },
        {
          $group: {
            _id: "$referralSource",
            count: { $sum: 1 }
          }
        }
      ]),

      // Languages by country
      User.aggregate([
        {
          $match: {
            created_at: { $gte: start, $lte: end },
            type: '4',
            churchId: { $exists: true, $ne: null },
            ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
          }
        },
        {
          $lookup: {
            from: 'church',
            localField: 'churchId',
            foreignField: '_id',
            as: 'church'
          }
        },
        {
          $match: {
            'church.0': { $exists: true }
          }
        },
        {
          $unwind: '$church'
        },
        {
          $match: {
            language: { $exists: true, $ne: null, $ne: "" },
            'church.country': { $exists: true, $ne: null, $ne: "" }
          }
        },
        {
          $group: {
            _id: {
              country: '$church.country',
              language: '$language'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.country': 1, '_id.language': 1 }
        }
      ]),

      // Average sermon duration
      Sermon.aggregate([
        {
          $match: {
            status: "End",
            startDateTime: { $exists: true, $ne: null, $ne: "" },
            endDateTime: { $exists: true, $ne: null, $ne: "" },
            churchId: { $exists: true, $ne: null },
            ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {}),
            $expr: {
              $and: [
                {
                  $gte: [
                    {
                      $dateFromString: {
                        dateString: "$startDateTime",
                        timezone: "Australia/Adelaide"  // ADD THIS LINE
                      }
                    },
                    start
                  ]
                },
                {
                  $lte: [
                    {
                      $dateFromString: {
                        dateString: "$startDateTime",
                        timezone: "Australia/Adelaide"  // ADD THIS LINE
                      }
                    },
                    end
                  ]
                }
              ]
            }
          }
        },
        {
          $lookup: {
            from: 'church',
            localField: 'churchId',
            foreignField: '_id',
            as: 'church'
          }
        },
        {
          $lookup: {
            from: 'usersListen',
            localField: '_id',
            foreignField: 'sermonId',
            as: 'listeners'
          }
        },
        {
          $unwind: '$church'
        },
        {
          $match: {
            'listeners.0': { $exists: true }  // ADD THIS STAGE
          }
        },
        {
          $addFields: {
            durationMinutes: {
              $divide: [
                {
                  $subtract: [
                    { $dateFromString: { dateString: "$endDateTime" } },
                    { $dateFromString: { dateString: "$startDateTime" } }
                  ]
                },
                60000
              ]
            },
            uniqueListeners: {
              $size: {
                $setUnion: [
                  {
                    $map: {
                      input: "$listeners",
                      as: "listener",
                      in: "$$listener.userId"
                    }
                  },
                  []
                ]
              }
            }
          }
        },
        // {
        //   $match: {
        //     durationMinutes: { $gt: 0, $lt: 600 }
        //   }
        // },
        {
          $group: {
            _id: {
              churchId: '$churchId',
              churchName: '$church.name'
            },
            averageDuration: { $avg: '$durationMinutes' },
            averageUsers: { $avg: '$uniqueListeners' },
            totalSermons: { $sum: 1 },
            totalDuration: { $sum: '$durationMinutes' }
          }
        },
        {
          $sort: { averageDuration: -1 }
        }
      ]),

      // Sermon listening languages statistics
      UserListen.aggregate([
        {
          $match: {
            createdAt: { $gte: listenStart, $lte: listenEnd },  // ← Use listenStart/listenEnd
            'selectedLanguage.name': { $exists: true, $ne: null, $ne: "" }
          }
        },
        {
          $lookup: {
            from: 'sermon',
            localField: 'sermonId',
            foreignField: '_id',
            as: 'sermon'
          }
        },
        {
          $unwind: {
            path: '$sermon',
            preserveNullAndEmptyArrays: false
          }
        },
        ...(churchIds.length > 0 ? [
          {
            $match: {
              'sermon.churchId': { $in: churchIds }
            }
          }
        ] : []),
        {
          $group: {
            _id: {
              languageId: '$selectedLanguage.id',
              languageName: '$selectedLanguage.name'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
    ]);

    const newUsers = newUsersResult[0] ? newUsersResult[0].count : 0;

    // Process results (keeping all original logic)
    const newSermons = newSermonsResult.length > 0 ? newSermonsResult[0].totalCount : 0;

    // Active users formatting
    const activeUsersByChurch = activeUsersResult.reduce((acc, item) => {
      acc[item._id.churchName || 'Unknown Church'] = item.activeUsers;
      return acc;
    }, {});

    // Get new salvations count - match exactly with getSalvationDetails
    const newSalvationsResult = await JesusClick.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      ...(churchIds.length > 0 ? [
        {
          $match: {
            'userDetails.churchId': { $in: churchIds }
          }
        }
      ] : []),
      {
        $count: "totalCount"
      }
    ]);

    const newSalvationsCount = newSalvationsResult.length > 0 ? newSalvationsResult[0].totalCount : 0;

    // Faith level stats processing
    const allFaithLevels = ['No faith', 'Uncertain', 'Open to faith', 'Actively Exploring', 'Strong faith'];
    const totalFaithUsers = faithLevels.reduce((sum, item) => sum + item.count, 0);

    let faithLevelStats = {};
    if (totalFaithUsers === 0) {
      allFaithLevels.forEach(level => {
        faithLevelStats[level] = "0.00%";
      });
    } else {
      const faithLevelMap = new Map();
      faithLevels.forEach(item => {
        const label = item._id.trim();
        faithLevelMap.set(label, item.count);
      });

      const rawPercentages = [];
      allFaithLevels.forEach(level => {
        const count = faithLevelMap.get(level) || 0;
        const percentage = (count / totalFaithUsers) * 100;
        rawPercentages.push({ level, percentage });
      });

      let totalRounded = 0;
      for (let i = 0; i < rawPercentages.length; i++) {
        if (i === rawPercentages.length - 1) {
          const lastPercentage = 100 - totalRounded;
          faithLevelStats[rawPercentages[i].level] = lastPercentage.toFixed(2) + "%";
        } else {
          const rounded = parseFloat(rawPercentages[i].percentage.toFixed(2));
          faithLevelStats[rawPercentages[i].level] = rounded.toFixed(2) + "%";
          totalRounded += rounded;
        }
      }
    }

    // Monthly breakdown processing
    let monthlyBreakdown = null;
    if (monthlyUsers.length > 0) {
      monthlyBreakdown = monthlyUsers.map(item => {
        if (period === 'year') {
          return {
            year: item._id.year,
            churchId: item._id.churchId,
            churchName: item._id.churchName || 'Unknown Church',
            count: item.count,
            period: `${item._id.year}`,
            monthName: `${item._id.year}`,
            month: null
          };
        } else if (period === 'week') {
          return {
            churchId: item._id.churchId,
            churchName: item._id.churchName || 'Unknown Church',
            count: item.count,
            period: `Week`,
            monthName: `Week`,
            month: null,
            year: null
          };
        } else if (period === 'month') {
          const monthName = moment().month(item._id.month - 1).format('MMMM');
          return {
            year: item._id.year,
            month: item._id.month,
            monthName: monthName,
            churchId: item._id.churchId,
            churchName: item._id.churchName || 'Unknown Church',
            count: item.count,
            period: `${moment().month(item._id.month - 1).format('MMM')} ${item._id.year}`,
          };
        } else {
          // Custom date range - like week, one record per church
          return {
            churchId: item._id.churchId,
            churchName: item._id.churchName || 'Unknown Church',
            count: item.count,
            period: `Custom Range`,
            monthName: `Custom Range`,
            month: null,
            year: null
          };
        }
      });
    }

    // Language stats processing
    const languages = ["english", "portuguese", "mandarin", "spanish", "indonesian"];
    let languageStats = {};

    const totalUsersWithLanguage = aggregatedStats.reduce((sum, item) => sum + item.count, 0);

    languages.forEach(lang => {
      const found = aggregatedStats.find(item => item._id === lang);
      const count = found ? found.count : 0;
      const percentage = totalUsersWithLanguage > 0 ? ((count / totalUsersWithLanguage) * 100).toFixed(2) : "0.00";
      languageStats[lang.charAt(0).toUpperCase() + lang.slice(1)] = `${percentage}%`;
    });

    // Referral source stats processing
    const referralSources = ["friend_family", "church_event", "social_media", "community_outreach", "online_search", "flyer_poster"];
    let referralSourceStats = {};

    const totalUsersWithReferral = aggregatedReferralStats.reduce((sum, item) => sum + item.count, 0);

    referralSources.forEach(source => {
      const found = aggregatedReferralStats.find(item => item._id === source);
      const count = found ? found.count : 0;
      const percentage = totalUsersWithReferral > 0 ? ((count / totalUsersWithReferral) * 100).toFixed(2) : "0.00";
      const readableSource = source.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      referralSourceStats[readableSource] = `${percentage}%`;
    });
    // Languages by country processing
    const languagesByCountryFormatted = {};
    const allLanguages = ["english", "portuguese", "mandarin", "spanish", "indonesian"];

    languagesByCountry.forEach(item => {
      const country = item._id.country;
      if (!languagesByCountryFormatted[country]) {
        languagesByCountryFormatted[country] = {};
        allLanguages.forEach(lang => {
          languagesByCountryFormatted[country][lang.charAt(0).toUpperCase() + lang.slice(1)] = 0;
        });
      }
    });

    languagesByCountry.forEach(item => {
      const country = item._id.country;
      const language = item._id.language;
      const formattedLanguage = language.charAt(0).toUpperCase() + language.slice(1);

      if (languagesByCountryFormatted[country]) {
        languagesByCountryFormatted[country][formattedLanguage] = item.count;
      }
    });

    // Average sermon duration processing
    const averageSermonDurationFormatted = {};
    averageSermonDuration.forEach(item => {
      const churchName = item._id.churchName || 'Unknown Church';
      const avgMinutes = Math.round(item.averageDuration);
      const hours = Math.floor(avgMinutes / 60);
      const minutes = avgMinutes % 60;

      let formattedDuration;
      if (hours > 0) {
        formattedDuration = `${hours}h ${minutes}m`;
      } else {
        formattedDuration = `${minutes}m`;
      }

      averageSermonDurationFormatted[churchName] = {
        averageDuration: formattedDuration,
        averageMinutes: avgMinutes,
        averageUsers: Math.round(item.averageUsers || 0),
        totalSermons: item.totalSermons,
        totalHours: Math.round(item.totalDuration / 60 * 10) / 10
      };
    });


    const sermonLanguagesFormatted = [];
    const totalListeners = sermonLanguageStats.reduce((sum, item) => sum + item.count, 0);

    if (totalListeners === 0) {
      sermonLanguagesFormatted.push({
        message: "No sermon listening data available for this period"
      });
    } else {
      const rawPercentages = sermonLanguageStats.map(item => ({
        languageId: item._id.languageId,
        languageName: item._id.languageName,
        count: item.count,
        rawPercentage: (item.count / totalListeners) * 100
      }));

      let totalRounded = 0;
      rawPercentages.forEach((item, index) => {
        if (index === rawPercentages.length - 1) {
          const finalPercentage = 100 - totalRounded;
          sermonLanguagesFormatted.push({
            languageId: item.languageId,
            languageName: item.languageName,
            count: item.count,
            percentage: parseFloat(finalPercentage.toFixed(2))
          });
        } else {
          const rounded = parseFloat(item.rawPercentage.toFixed(2));
          sermonLanguagesFormatted.push({
            languageId: item.languageId,
            languageName: item.languageName,
            count: item.count,
            percentage: rounded
          });
          totalRounded += rounded;
        }
      });
    }

    res.json({
      totalSermons,
      totalSalvations: salvationsCount,
      totalUsers,
      totalChurches,
      newUsers,
      totalStaff,
      totalEvents,
      newSalvations: newSalvationsCount,
      activeUsersByChurch,
      newSermons,
      faithLevelStats,
      monthlyBreakdown,
      languageStats,
      averageSermonDuration: averageSermonDurationFormatted,
      referralSourceStats,
      languagesByCountry: languagesByCountryFormatted,
      sermonListeningLanguages: sermonLanguagesFormatted,
      dateRange: {
        start: moment(start).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
        end: moment(end).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
        timezone: 'Australia/Adelaide'
      }
    });

  } catch (error) {
    console.error("Error getting church stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getChurchSpecificStats = async (req, res) => {
  try {
    const { churchId, startDate, endDate, period, userId } = req.query;

    // Validate churchId is provided
    if (!churchId) {
      return res.status(400).json({ message: "churchId is required" });
    }

    let start, end;

    if (period) {
      const nowACST = moment().tz('Australia/Adelaide');
      console.log('Current Australia/Adelaide time:', nowACST.format('YYYY-MM-DD HH:mm:ss'));

      switch (period.toLowerCase()) {
        case 'today':
          start = nowACST.clone().startOf('day').toDate();
          end = nowACST.clone().endOf('day').toDate();
          break;
        case 'week':
          start = nowACST.clone().startOf('week').toDate();
          end = nowACST.clone().endOf('week').toDate();
          break;
        case 'month':
          start = nowACST.clone().startOf('month').toDate();
          end = nowACST.clone().endOf('month').toDate();
          break;
        case 'year':
          start = nowACST.clone().startOf('year').toDate();
          end = nowACST.clone().endOf('year').toDate();
          break;
        default:
          return res.status(400).json({ message: "Invalid period. Use: today, week, month, year" });
      }
    } else {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required when period is not specified" });
      }
      start = moment.tz(startDate, 'Australia/Adelaide').startOf('day').toDate();
      end = moment.tz(endDate, 'Australia/Adelaide').endOf('day').toDate();
    }

    // Convert churchId to ObjectId
    const churchObjectId = new mongoose.Types.ObjectId(churchId.trim());

    console.log('Debugging church-specific stats...');
    console.log('Church ID:', churchId);
    console.log('Date range:',
      moment(start).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
      'to',
      moment(end).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss')
    );

    // Get church details
    const churchDetails = await Church.findById(churchObjectId);
    if (!churchDetails) {
      return res.status(404).json({ message: "Church not found" });
    }

    // 1. Total sermons - conditional based on userId
    let totalSermonsResult;

    if (userId) {
      // If userId provided, get sermons attended by that specific user
      const userObjectId = new mongoose.Types.ObjectId(userId.trim());

      totalSermonsResult = await Sermon.aggregate([
        {
          $match: {
            churchId: churchObjectId
          }
        },
        {
          $lookup: {
            from: 'usersListen',
            localField: '_id',
            foreignField: 'sermonId',
            as: 'listeners'
          }
        },
        {
          $match: {
            listeners: {
              $elemMatch: {
                userId: userObjectId
              }
            }
          }
        },
        {
          $count: 'totalCount'
        }
      ]);
    } else {
      // If no userId, get all sermons with at least one listener (original logic)
      totalSermonsResult = await Sermon.aggregate([
        {
          $match: {
            churchId: churchObjectId
          }
        },
        {
          $lookup: {
            from: 'usersListen',
            localField: '_id',
            foreignField: 'sermonId',
            as: 'listeners'
          }
        },
        {
          $match: {
            'listeners.0': { $exists: true } // Only include sermons with at least one listener
          }
        },
        {
          $count: 'totalCount'
        }
      ]);
    }

    const totalSermons = totalSermonsResult.length > 0 ? totalSermonsResult[0].totalCount : 0;

    // 2. Total users for this church (all time)
    const totalUsers = await User.countDocuments({
      churchId: churchObjectId,
      type: '4'
    });

    // 3. Total staff for this church (all time)
    const totalStaff = await User.countDocuments({
      churchId: churchObjectId,
      type: '3'
    });

    // 4. Total events for this church (all time)
    const totalEvents = await Event.countDocuments({
      churchId: churchObjectId
    });


    // 5 NEW: Total sermons attended by specific user
    let totalSermonsAttendedByUser = 0;

    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId.trim());
      const attendedSermonsResult = await UserListen.aggregate([
        {
          $match: {
            userId: userObjectId,
            status: "End"
          }
        },
        {
          $lookup: {
            from: 'sermon',
            localField: 'sermonId',
            foreignField: '_id',
            as: 'sermonDetails'
          }
        },
        {
          $unwind: '$sermonDetails'
        },
        {
          $match: {
            'sermonDetails.churchId': churchObjectId
          }
        },
        {
          $group: {
            _id: '$sermonId'
          }
        },
        {
          $count: 'totalCount'
        }
      ]);
      totalSermonsAttendedByUser = attendedSermonsResult.length > 0 ? attendedSermonsResult[0].totalCount : 0;
    }

    // 6. Total salvations for this church (all time)
    const totalSalvationsResult = await JesusClick.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $match: {
          'userDetails.churchId': churchObjectId
        }
      },
      {
        $count: "totalCount"
      }
    ]);
    const totalSalvations = totalSalvationsResult.length > 0 ? totalSalvationsResult[0].totalCount : 0;


    // 7. Active users in date range for this church
    const activeUsers = await User.countDocuments({
      churchId: churchObjectId,
      lastActive: { $gte: start, $lte: end }
    });

    console.log('Church-specific stats completed for:', churchDetails.name);

    res.json({
      church: {
        id: churchDetails._id,
        name: churchDetails.name,
        city: churchDetails.city,
        state: churchDetails.state,
        country: churchDetails.country
      },
      totalSermons,
      totalSermonsAttendedByUser,
      totalSalvations,
      totalUsers,
      totalStaff,
      totalEvents,
      activeUsers
    });

  } catch (error) {
    console.error("Error getting church-specific stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSermonDetails = async (req, res) => {
  try {
    const { churchId, startDate, endDate, period } = req.query;

    let start, end;

    if (period) {
      const nowACST = moment().tz('Australia/Adelaide');

      switch (period.toLowerCase()) {
        case 'today':
          start = nowACST.clone().startOf('day').toDate();
          end = nowACST.clone().endOf('day').toDate();
          break;
        case 'week':
          start = nowACST.clone().startOf('week').toDate();
          end = nowACST.clone().endOf('week').toDate();
          break;
        case 'month':
          start = nowACST.clone().startOf('month').toDate();
          end = nowACST.clone().endOf('month').toDate();
          break;
        case 'year':
          start = nowACST.clone().startOf('year').toDate();
          end = nowACST.clone().endOf('year').toDate();
          break;
        default:
          return res.status(400).json({ message: "Invalid period. Use: today, week, month, year" });
      }
    } else {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required when period is not specified" });
      }
      start = moment.tz(startDate, 'Australia/Adelaide').startOf('day').toDate();
      end = moment.tz(endDate, 'Australia/Adelaide').endOf('day').toDate();
    }

    // Handle multiple church IDs
    let churchIds = [];
    if (churchId) {
      churchIds = churchId.split(',').map(id => new mongoose.Types.ObjectId(id.trim()));
    }
    // Get sermons with proper date filtering - UPDATED TO MATCH 1st CONTROLLER
    const sermons = await Sermon.aggregate([
      {
        $match: {
          status: "End",
          startDateTime: { $exists: true, $ne: null, $ne: "" },
          endDateTime: { $exists: true, $ne: null, $ne: "" },
          churchId: { $exists: true, $ne: null },
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $dateFromString: {
                      dateString: "$startDateTime",
                      timezone: "Australia/Adelaide"
                    }
                  },
                  start
                ]
              },
              {
                $lte: [
                  {
                    $dateFromString: {
                      dateString: "$startDateTime",
                      timezone: "Australia/Adelaide"
                    }
                  },
                  end
                ]
              }
            ]
          },
          ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
        }
      },
      {
        $lookup: {
          from: 'usersListen',
          localField: '_id',
          foreignField: 'sermonId',
          as: 'listeners'
        }
      },
      {
        $match: {
          'listeners.0': { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'church',
          localField: 'churchId',
          foreignField: '_id',
          as: 'churchId',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$churchId',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'adminStaffUserId',
          foreignField: '_id',
          as: 'adminStaffUserId',
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$adminStaffUserId',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          broadcast_id: 1,
          status: 1,
          startDateTime: 1,
          endDateTime: 1,
          source_language: 1,
          gender: 1,
          voice_id: 1,
          broadcaster_info: 1,
          active_listeners: 1,
          join_url: 1,
          churchId: 1,
          adminStaffUserId: 1,
          listeners: 1
        }
      },
      {
        $sort: { startDateTime: -1 }
      }
    ]);

    if (sermons.length === 0) {
      return res.json({
        sermons: [],
        count: 0,
        dateRange: {
          start: moment(start).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
          end: moment(end).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
          timezone: 'Australia/Adelaide'
        }
      });
    }

    // Get sermon IDs for listener lookup
    const sermonIds = sermons.map(sermon => sermon._id);

    // Get listeners for these sermons
    const usersListens = await UserListen.find({
      sermonId: { $in: sermonIds },
      // status: "End"
    }).lean();

    // Get user IDs for user details lookup
    const userIds = [...new Set(usersListens.map(user => user.userId?.toString()).filter(Boolean))];

    // Get user details and Jesus clicks in parallel
    const [listeningUsers, jesusClicks] = await Promise.all([
      User.find({ _id: { $in: userIds } }, { firstName: 1, lastName: 1, email: 1, phone: 1 }).lean(),
      JesusClick.find({ userId: { $in: userIds } }).lean()
    ]);

    // Create lookup maps
    const listeningUsersMap = new Map(listeningUsers.map(user => [user._id.toString(), user]));
    const jesusClicksSet = new Set(jesusClicks.map(jc => `${jc.userId}_${jc.sermonId}`));

    // Process sermon details with listeners
    const sermonsWithListeners = sermons.map(sermon => {
      // Get all listening sessions for this sermon
      const sermonListeners = usersListens
        .filter(userListen => userListen.sermonId?.toString() === sermon._id?.toString());

      // Group listening sessions by userId
      const userSessionsMap = {};
      sermonListeners.forEach(userListen => {
        const userId = userListen.userId?.toString();
        if (!userSessionsMap[userId]) {
          userSessionsMap[userId] = [];
        }
        userSessionsMap[userId].push(userListen);
      });

      // Process listeners
      const listeners = Object.keys(userSessionsMap)
        .map(userId => {
          const user = listeningUsersMap.get(userId);
          if (!user) return null;

          const userSessions = userSessionsMap[userId];
          userSessions.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

          // Check Jesus click
          const jesusClickKey = `${userId}_${sermon._id.toString()}`;
          const clickedJesus = jesusClicksSet.has(jesusClickKey);

          return {
            userId: userId,
            userName: `${user.firstName} ${user.lastName || ''}`.trim(),
            userEmail: user.email,
            userPhone: user.phone || '',
            startDateTime: userSessions[0].startDateTime || 'N/A',
            endDateTime: userSessions[userSessions.length - 1].endDateTime || 'N/A',
            jesusClicked: clickedJesus
          };
        })
        .filter(listener => listener !== null);

      return {
        sermonId: sermon._id,
        sermonName: sermon.sermonName || 'Live Sermon',
        adminName: sermon.adminStaffUserId ? `${sermon.adminStaffUserId.firstName} ${sermon.adminStaffUserId.lastName || ''}`.trim() : 'Unknown',
        adminPhone: sermon.adminStaffUserId ? sermon.adminStaffUserId.phone : 'Unknown',
        SermonStartDateTime: sermon.startDateTime,
        churchName: sermon.churchId ? sermon.churchId.name : 'Unknown',
        listeners: listeners
      };
    });
    const sermonsWithActualListeners = sermonsWithListeners;
    res.json({
      sermons: sermonsWithActualListeners,
      count: sermonsWithActualListeners.length,
      dateRange: {
        start: moment(start).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
        end: moment(end).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
        timezone: 'Australia/Adelaide'
      }
    });

  } catch (error) {
    console.error("Error getting sermon details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getNewUsersDetails = async (req, res) => {
  try {
    const { churchId, startDate, endDate, period } = req.query;

    let start, end;

    // Date logic (same as before)
    if (period) {
      const nowACST = moment().tz('Australia/Adelaide');
      switch (period.toLowerCase()) {
        case 'today':
          start = nowACST.clone().startOf('day').toDate();
          end = nowACST.clone().endOf('day').toDate();
          break;
        case 'week':
          start = nowACST.clone().startOf('week').toDate();
          end = nowACST.clone().endOf('week').toDate();
          break;
        case 'month':
          start = nowACST.clone().startOf('month').toDate();
          end = nowACST.clone().endOf('month').toDate();
          break;
        case 'year':
          start = nowACST.clone().startOf('year').toDate();
          end = nowACST.clone().endOf('year').toDate();
          break;
        default:
          return res.status(400).json({ message: "Invalid period. Use: today, week, month, year" });
      }
    } else {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required when period is not specified" });
      }
      start = moment.tz(startDate, 'Australia/Adelaide').startOf('day').toDate();
      end = moment.tz(endDate, 'Australia/Adelaide').endOf('day').toDate();
    }

    // Handle multiple church IDs
    let churchIds = [];
    if (churchId) {
      churchIds = churchId.split(',').map(id => new mongoose.Types.ObjectId(id.trim()));
    }

    // Get new users with church details - NO hardcoded fields
    const newUsers = await User.aggregate([
      {
        $match: {
          created_at: { $gte: start, $lte: end },
          type: '4',
          ...(churchIds.length > 0 ? { churchId: { $in: churchIds } } : {})
        }
      },
      {
        $lookup: {
          from: 'church',
          localField: 'churchId',
          foreignField: '_id',
          as: 'churchData'
        }
      },
      {
        $unwind: {
          path: '$churchData',
          preserveNullAndEmptyArrays: true
        }
      },
      // No $project stage - keeps ALL user fields
      {
        $sort: { created_at: -1 }
      }
    ]);

    // Dynamic formatting - processes all fields automatically
    const formattedUsers = newUsers.map(user => {
      // Create a new object with all user fields
      const formattedUser = {};

      // Copy all user fields except sensitive ones
      const excludeFields = ['password', '__v'];

      Object.keys(user).forEach(key => {
        if (!excludeFields.includes(key)) {
          if (key === '_id') {
            formattedUser.userId = user._id;
          } else if (key === 'created_at' || key === 'updated_at') {
            // Format dates
            formattedUser[key] = user[key] ? moment(user[key]).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss') : 'N/A';
          } else if (key === 'termAgreement') {
            // Format boolean
            formattedUser[key] = user[key] ? 'Yes' : 'No';
          } else if (key === 'churchData') {
            // Handle church data
            if (user.churchData) {
              formattedUser.churchName = user.churchData.name || 'N/A';
              formattedUser.churchAddress = user.churchData.address || 'N/A';
              formattedUser.churchCity = user.churchData.city || 'N/A';
              formattedUser.churchState = user.churchData.state || 'N/A';
              formattedUser.churchCountry = user.churchData.country || 'N/A';
              formattedUser.churchLocation = user.churchData.city && user.churchData.state
                ? `${user.churchData.city}, ${user.churchData.state}, ${user.churchData.country || ''}`
                : 'N/A';
            } else {
              formattedUser.churchName = 'No Church Assigned';
              formattedUser.churchLocation = 'N/A';
            }
          } else {
            // Copy other fields as-is or with null handling
            formattedUser[key] = user[key] || 'N/A';
          }
        }
      });

      // Add computed fields
      formattedUser.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
      formattedUser.registrationDate = user.created_at ? moment(user.created_at).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss') : 'N/A';

      return formattedUser;
    });

    res.json({
      users: formattedUsers,
      count: formattedUsers.length,
      dateRange: {
        start: moment(start).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
        end: moment(end).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
        timezone: 'Australia/Adelaide'
      }
    });

  } catch (error) {
    console.error("Error getting new users details:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getSalvationDetails = async (req, res) => {
  try {
    const { churchId, startDate, endDate, period } = req.query;

    let start, end;

    // Same date logic as other controllers
    if (period) {
      const nowACST = moment().tz('Australia/Adelaide');

      switch (period.toLowerCase()) {
        case 'today':
          start = nowACST.clone().startOf('day').toDate();
          end = nowACST.clone().endOf('day').toDate();
          break;
        case 'week':
          start = nowACST.clone().startOf('week').toDate();
          end = nowACST.clone().endOf('week').toDate();
          break;
        case 'month':
          start = nowACST.clone().startOf('month').toDate();
          end = nowACST.clone().endOf('month').toDate();
          break;
        case 'year':
          start = nowACST.clone().startOf('year').toDate();
          end = nowACST.clone().endOf('year').toDate();
          break;
        default:
          return res.status(400).json({ message: "Invalid period. Use: today, week, month, year" });
      }
    } else {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required when period is not specified" });
      }
      start = moment.tz(startDate, 'Australia/Adelaide').startOf('day').toDate();
      end = moment.tz(endDate, 'Australia/Adelaide').endOf('day').toDate();
    }

    // Handle multiple church IDs
    let churchIds = [];
    if (churchId) {
      churchIds = churchId.split(',').map(id => new mongoose.Types.ObjectId(id.trim()));
    }

    // Get salvation details with user and church information
    const salvationDetails = await JesusClick.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $lookup: {
          from: 'church',
          localField: 'userDetails.churchId',
          foreignField: '_id',
          as: 'churchData'
        }
      },
      {
        $unwind: {
          path: '$churchData',
          preserveNullAndEmptyArrays: true
        }
      },
      // Apply church filter if specified
      ...(churchIds.length > 0 ? [
        {
          $match: {
            'userDetails.churchId': { $in: churchIds }
          }
        }
      ] : []),
      {
        $project: {
          _id: 1,
          userId: 1,
          jesusClicked: 1,
          count: 1,
          isReferred: 1,
          createdAt: 1,
          updatedAt: 1,
          userName: {
            $concat: [
              { $ifNull: ['$userDetails.firstName', ''] },
              ' ',
              { $ifNull: ['$userDetails.lastName', ''] }
            ]
          },
          userEmail: '$userDetails.email',
          userPhone: '$userDetails.phone',
          userFaithLevel: '$userDetails.faithLevel',
          userLanguage: '$userDetails.language',
          userSuburb: '$userDetails.suburb',
          churchName: '$churchData.name',
          churchCity: '$churchData.city',
          churchState: '$churchData.state',
          churchCountry: '$churchData.country'
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Format the response
    const formattedSalvations = salvationDetails.map(salvation => ({
      salvationId: salvation._id,
      userId: salvation.userId,
      userName: salvation.userName.trim() || 'N/A',
      userEmail: salvation.userEmail || 'N/A',
      userPhone: salvation.userPhone || 'N/A',
      userFaithLevel: salvation.userFaithLevel || 'N/A',
      userLanguage: salvation.userLanguage || 'N/A',
      userSuburb: salvation.userSuburb || 'N/A',
      clickCount: salvation.count || 0,
      jesusClicked: salvation.jesusClicked || 'No',
      isReferred: salvation.isReferred ? 'Yes' : 'No',
      salvationDate: moment(salvation.createdAt).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
      lastUpdated: moment(salvation.updatedAt).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
      churchName: salvation.churchName || 'No Church Assigned',
      churchLocation: salvation.churchCity && salvation.churchState
        ? `${salvation.churchCity}, ${salvation.churchState}, ${salvation.churchCountry || ''}`
        : 'N/A'
    }));

    // Calculate summary statistics
    const totalSalvations = formattedSalvations.length;
    const totalClicks = formattedSalvations.reduce((sum, salvation) => sum + salvation.clickCount, 0);
    const uniqueUsers = [...new Set(formattedSalvations.map(s => s.userId.toString()))].length;

    // Group by church for summary
    const salvationsByChurch = formattedSalvations.reduce((acc, salvation) => {
      const churchName = salvation.churchName;
      if (!acc[churchName]) {
        acc[churchName] = 0;
      }
      acc[churchName]++;
      return acc;
    }, {});

    // Group by faith level
    const salvationsByFaithLevel = formattedSalvations.reduce((acc, salvation) => {
      const faithLevel = salvation.userFaithLevel;
      if (!acc[faithLevel]) {
        acc[faithLevel] = 0;
      }
      acc[faithLevel]++;
      return acc;
    }, {});

    res.json({
      salvations: formattedSalvations,
      summary: {
        totalSalvations,
        uniqueUsers,
        totalClicks,
        averageClicksPerUser: uniqueUsers > 0 ? (totalClicks / uniqueUsers).toFixed(2) : 0,
        salvationsByChurch,
        salvationsByFaithLevel
      },
      count: formattedSalvations.length,
      dateRange: {
        start: moment(start).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
        end: moment(end).tz('Australia/Adelaide').format('YYYY-MM-DD HH:mm:ss'),
        timezone: 'Australia/Adelaide'
      }
    });

  } catch (error) {
    console.error("Error getting salvation details:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



cron.schedule('1 0 * * *', () => {
  console.log('Checking for weekly resets...');
  resetWeeklyLimits();
});
import mongoose from 'mongoose';
import UsersListen from '../model/usersListen.js'
import Sermon from '../model/sermonModel.js';
import User from '../model/authModel.js';
import moment from 'moment-timezone';
import Church from '../model/churchModel.js';
import JesusClick from '../model/jeasusClicked.js';

// Create a new usersListen entry when joining sermon
export const createUsersListen = async (req, res) => {
    try {
        const { churchId, sermonId, userId, startDateTime, status, jesusClicked, selectedLanguage  } = req.body;

        let startACST;
        if (startDateTime) {
            const incoming = moment.parseZone(startDateTime);
            const isACST = incoming.tz() === 'Australia/Adelaide' || incoming.format('Z') === '+09:30';

            startACST = isACST
                ? incoming
                : incoming.tz('Australia/Adelaide');
        } else {
            startACST = moment().tz('Australia/Adelaide');
        }

        const formattedStartACST = startACST.format('YYYY-MM-DD HH:mm:ss');

        const newUsersListen = new UsersListen({
            churchId,
            sermonId,
            userId,
            startDateTime: formattedStartACST,
            status: status || 'Live',
            jesusClicked: jesusClicked || 'No',
            selectedLanguage
        });

        await newUsersListen.save();
        if (userId) {
            await User.findByIdAndUpdate(userId, { lastActive: new Date() });
        }
        res.status(201).json(newUsersListen);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const updateUsersListen = async (req, res) => {
    try {
        const { endDateTime, status } = req.body;

        let endACST;
        if (endDateTime) {
            const incoming = moment(endDateTime); // Parse as neutral timestamp
            if (!incoming.isValid()) {
                throw new Error('Invalid date format');
            }
            // Check if already in GMT+9:30
            const offsetHours = incoming.utcOffset() / 60;
            if (offsetHours === 9.5) {
                endACST = incoming.format('YYYY-MM-DD HH:mm:ss'); // Already in GMT+9:30, format as string
            } else {
                // Convert to GMT+9:30
                endACST = incoming.clone().utcOffset('+09:30').format('YYYY-MM-DD HH:mm:ss');
            }
        } else {
            endACST = moment().utcOffset('+09:30').format('YYYY-MM-DD HH:mm:ss'); // Default to now in GMT+9:30
        }

        const updatedUsersListen = await UsersListen.findByIdAndUpdate(
            req.params.id,
            {
                endDateTime: endACST,
                status: status || 'End'
            },
            { new: true }
        );

        if (!updatedUsersListen) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        res.status(200).json(updatedUsersListen);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// export const getAllUsersListen = async (req, res) => {
//     try {
//         console.log("Fetching users who listened with status 'End'...");

//         const { churchId } = req.query;

//         const usersListens = await UsersListen.find({ status: "End" });
//         if (usersListens.length === 0) {
//             return res.status(200).json({ message: "No users listened to any sermons yet", data: [] });
//         }

//         const sermonIds = [...new Set(usersListens.map(user => user.sermonId?.toString()).filter(Boolean))];
//         const userIds = [...new Set(usersListens.map(user => user.userId?.toString()).filter(Boolean))];


//         const sermonQuery = churchId
//             ? { _id: { $in: sermonIds }, status: { $ne: "Live" }, churchId }
//             : { _id: { $in: sermonIds }, status: { $ne: "Live" } };
//         const sermons = await Sermon.find(sermonQuery);
//         const adminStaffIds = [...new Set(sermons.map(sermon => sermon.adminStaffUserId?.toString()).filter(Boolean))];
//         const churchIds = [...new Set(sermons.map(sermon => sermon.churchId?.toString()).filter(Boolean))];

//         const adminStaffUsers = await User.find({ _id: { $in: adminStaffIds } }, { firstName: 1, lastName: 1, email: 1, phone: 1 });
//         const listeningUsers = await User.find({ _id: { $in: userIds } }, { firstName: 1, lastName: 1, email: 1, phone: 1 });
//         const churches = await Church.find({ _id: { $in: churchIds } }, { name: 1, address: 1, city: 1, state: 1, country: 1, senior_pastor_name: 1 });


//         const jesusClicks = await JesusClick.find({ userId: { $in: userIds } });

//         const sermonDetails = sermons
//             .map(sermon => {
//                 const admin = adminStaffUsers.find(user => user?._id?.toString() === sermon.adminStaffUserId?.toString());
//                 const church = churches.find(ch => ch?._id?.toString() === sermon.churchId?.toString());

//                 const listeners = usersListens
//                     .filter(userListen => userListen.sermonId?.toString() === sermon._id?.toString())
//                     .map(userListen => {
//                         const user = listeningUsers.find(user => user?._id?.toString() === userListen.userId?.toString());
//                         const clickedJesus = jesusClicks.some(jc =>
//                             jc.userId?.toString() === userListen.userId?.toString() &&
//                             jc.sermonId?.toString() === sermon._id?.toString()
//                         );

//                         return {
//                             userId: userListen.userId,
//                             userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
//                             userEmail: user ? user.email : 'Unknown',
//                             userPhone: user ? user.phone : 'Unknown',
//                             startDateTime: userListen.startDateTime || 'N/A',
//                             endDateTime: userListen.endDateTime || 'N/A',
//                             jesusClicked: clickedJesus
//                         };
//                     })
//                     .filter(listener => listener.userName !== 'Unknown');

//                 return {
//                     sermonId: sermon._id,
//                     sermonName: sermon.sermonName,
//                     adminName: admin ? `${admin.firstName} ${admin.lastName}` : 'Unknown',
//                     adminPhone: admin ? admin.phone : 'Unknown',
//                     SermonStartDateTime: sermon.startDateTime,
//                     churchName: church ? church.name : 'Unknown',
//                     listeners: listeners
//                 };
//             })
//             .filter(sermonDetail => sermonDetail.listeners.length > 0);

//         if (sermonDetails.length === 0) {
//             return res.status(200).json({ message: "No sermons with valid listeners found", data: [] });
//         }

//         sermonDetails.sort((a, b) => new Date(b.SermonStartDateTime) - new Date(a.SermonStartDateTime));

//         console.log("Sorted sermonDetails:", sermonDetails.map(sermon => ({
//             sermonName: sermon.sermonName,
//             SermonStartDateTime: sermon.SermonStartDateTime
//         })));

//         res.status(200).json(sermonDetails);
//     } catch (error) {
//         console.error("Error fetching users and sermons:", error);
//         res.status(500).json({ message: "Server error", error });
//     }
// };


// export const getAllUsersListen = async (req, res) => {
//     try {
//         console.log("Fetching users who listened with status 'End'...");

//         const { churchId } = req.query;

//         // Step 1: Get initial user listens data
//         const usersListens = await UsersListen.find({ status: "End" }).lean();
//         if (usersListens.length === 0) {
//             return res.status(200).json({ message: "No users listened to any sermons yet", data: [] });
//         }

//         // Step 2: Extract unique IDs (same as original)
//         const sermonIds = [...new Set(usersListens.map(user => user.sermonId?.toString()).filter(Boolean))];
//         const userIds = [...new Set(usersListens.map(user => user.userId?.toString()).filter(Boolean))];

//         // Step 3: Build sermon query (same as original)
//         const sermonQuery = churchId
//             ? { _id: { $in: sermonIds }, status: { $ne: "Live" }, churchId }
//             : { _id: { $in: sermonIds }, status: { $ne: "Live" } };

//         const sermons = await Sermon.find(sermonQuery).lean();

//         // Step 4: Extract IDs for related queries
//         const adminStaffIds = [...new Set(sermons.map(sermon => sermon.adminStaffUserId?.toString()).filter(Boolean))];
//         const churchIds = [...new Set(sermons.map(sermon => sermon.churchId?.toString()).filter(Boolean))];

//         // Step 5: Run all related queries in parallel (BIG OPTIMIZATION)
//         const [adminStaffUsers, listeningUsers, churches, jesusClicks] = await Promise.all([
//             User.find({ _id: { $in: adminStaffIds } }, { firstName: 1, lastName: 1, email: 1, phone: 1 }).lean(),
//             User.find({ _id: { $in: userIds } }, { firstName: 1, lastName: 1, email: 1, phone: 1 }).lean(),
//             Church.find({ _id: { $in: churchIds } }, { name: 1, address: 1, city: 1, state: 1, country: 1, senior_pastor_name: 1 }).lean(),
//             JesusClick.find({ userId: { $in: userIds } }).lean()
//         ]);

//         // Step 6: Create lookup maps for O(1) access (OPTIMIZATION)
//         const adminStaffMap = new Map(adminStaffUsers.map(user => [user._id.toString(), user]));
//         const listeningUsersMap = new Map(listeningUsers.map(user => [user._id.toString(), user]));
//         const churchesMap = new Map(churches.map(church => [church._id.toString(), church]));

//         // Create Jesus clicks lookup for faster checking
//         const jesusClicksSet = new Set(jesusClicks.map(jc => `${jc.userId}_${jc.sermonId}`));

//         // Step 7: Process sermon details (SAME LOGIC as original, but optimized)
//         const sermonDetails = sermons
//             .map(sermon => {
//                 const admin = adminStaffMap.get(sermon.adminStaffUserId?.toString());
//                 const church = churchesMap.get(sermon.churchId?.toString());

//                 // Get all listening sessions for this sermon (same as original)
//                 const sermonListeners = usersListens
//                     .filter(userListen => userListen.sermonId?.toString() === sermon._id?.toString());

//                 // Group listening sessions by userId (same as original)
//                 const userSessionsMap = {};
//                 sermonListeners.forEach(userListen => {
//                     const userId = userListen.userId?.toString();
//                     if (!userSessionsMap[userId]) {
//                         userSessionsMap[userId] = [];
//                     }
//                     userSessionsMap[userId].push(userListen);
//                 });

//                 // Consolidate sessions for each user with overlap logic (EXACT SAME as original)
//                 const listeners = Object.keys(userSessionsMap)
//                     .map(userId => {
//                         const user = listeningUsersMap.get(userId); // Optimized lookup
//                         if (!user) return null;

//                         const userSessions = userSessionsMap[userId];

//                         // Sort sessions by start time (same as original)
//                         userSessions.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

//                         // Merge overlapping sessions but keep original date format (EXACT SAME as original)
//                         const mergedSessions = [];

//                         for (let i = 0; i < userSessions.length; i++) {
//                             const currentSession = userSessions[i];

//                             // Skip sessions with invalid dates (same as original)
//                             if (!currentSession.startDateTime || !currentSession.endDateTime) continue;

//                             const currentStart = new Date(currentSession.startDateTime);
//                             const currentEnd = new Date(currentSession.endDateTime);

//                             // Skip sessions with invalid dates (same as original)
//                             if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) continue;

//                             if (mergedSessions.length === 0) {
//                                 // First session (same as original)
//                                 mergedSessions.push({
//                                     startDateTime: currentSession.startDateTime,
//                                     endDateTime: currentSession.endDateTime,
//                                     start: currentStart,
//                                     end: currentEnd
//                                 });
//                             } else {
//                                 const lastMerged = mergedSessions[mergedSessions.length - 1];

//                                 // Check if current session overlaps with the last merged session (same as original)
//                                 if (currentStart <= lastMerged.end) {
//                                     // Overlap detected - extend the end time if current session ends later (same as original)
//                                     if (currentEnd > lastMerged.end) {
//                                         lastMerged.endDateTime = currentSession.endDateTime;
//                                         lastMerged.end = currentEnd;
//                                     }
//                                 } else {
//                                     // No overlap - add as separate session (same as original)
//                                     mergedSessions.push({
//                                         startDateTime: currentSession.startDateTime,
//                                         endDateTime: currentSession.endDateTime,
//                                         start: currentStart,
//                                         end: currentEnd
//                                     });
//                                 }
//                             }
//                         }

//                         // If no valid sessions found, skip this user (same as original)
//                         if (mergedSessions.length === 0) return null;

//                         // Check Jesus click efficiently (optimized)
//                         const jesusClickKey = `${userId}_${sermon._id.toString()}`;
//                         const clickedJesus = jesusClicksSet.has(jesusClickKey);

//                         return {
//                             userId: userId,
//                             userName: `${user.firstName} ${user.lastName || ''}`.trim(),
//                             userEmail: user.email,
//                             userPhone: user.phone || '',
//                             startDateTime: userSessions[0].startDateTime || 'N/A',
//                             endDateTime: userSessions[userSessions.length - 1].endDateTime || 'N/A',
//                             jesusClicked: clickedJesus
//                         };
//                     })
//                     .filter(listener => listener !== null);

//                 return {
//                     sermonId: sermon._id,
//                     sermonName: sermon.sermonName,
//                     adminName: admin ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Unknown',
//                     adminPhone: admin ? admin.phone : 'Unknown',
//                     SermonStartDateTime: sermon.startDateTime,
//                     churchName: church ? church.name : 'Unknown',
//                     listeners: listeners
//                 };
//             })
//             .filter(sermonDetail => sermonDetail.listeners.length > 0);

//         if (sermonDetails.length === 0) {
//             return res.status(200).json({ message: "No sermons with valid listeners found", data: [] });
//         }

//         // Sort by sermon start time (same as original)
//         sermonDetails.sort((a, b) => new Date(b.SermonStartDateTime) - new Date(a.SermonStartDateTime));

//         res.status(200).json(sermonDetails);
//     } catch (error) {
//         console.error("Error fetching users and sermons:", error);
//         res.status(500).json({ message: "Server error", error });
//     }
// };



// export const getLiveUsersListen = async (req, res) => {
//     try {
//         const { churchId } = req.query; // Get churchId from query parameters

//         const usersListensLive = await UsersListen.find({ status: { $in: ["Live", "End"] } });
//         const sermonIdsLive = [...new Set(usersListensLive.map(user => user.sermonId?.toString()).filter(Boolean))];
//         const userIdsLive = [...new Set(usersListensLive.map(user => user.userId?.toString()).filter(Boolean))];

//         // Add churchId filter to Sermon.find if provided
//         const sermonQuery = churchId
//             ? { _id: { $in: sermonIdsLive }, churchId }
//             : { _id: { $in: sermonIdsLive } };
//         const allSermons = await Sermon.find(sermonQuery, { sermonName: 1, startDateTime: 1, endDateTime: 1, adminStaffUserId: 1, churchId: 1, status: 1 });
//         const endedSermons = allSermons.filter(sermon => sermon.status === "End");

//         for (const sermon of endedSermons) {
//             await UsersListen.updateMany(
//                 { sermonId: sermon._id, status: "Live" },
//                 { $set: { endDateTime: sermon.endDateTime, status: "End" } }
//             );
//         }

//         const sermonsLive = allSermons.filter(sermon => sermon.status !== "End");
//         if (sermonsLive.length === 0) {
//             return res.status(200).json([]);
//         }

//         const adminStaffIdsLive = [...new Set(sermonsLive.map(sermon => sermon.adminStaffUserId?.toString()).filter(Boolean))];
//         const churchIdsLive = [...new Set(sermonsLive.map(sermon => sermon.churchId?.toString()).filter(Boolean))];

//         const adminStaffUsers = await User.find({ _id: { $in: adminStaffIdsLive } }, { firstName: 1, lastName: 1, email: 1 });
//         const listeningUsers = await User.find({ _id: { $in: userIdsLive } }, { firstName: 1, lastName: 1, email: 1 });
//         const churches = await Church.find({ _id: { $in: churchIdsLive } }, { name: 1, address: 1, city: 1, state: 1, country: 1, senior_pastor_name: 1 });

//         // Fetch Jesus Click data
//         const jesusClicksLive = await JesusClick.find({ userId: { $in: userIdsLive } });

//         const sermonDetailsLive = sermonsLive.map(sermon => {
//             const admin = adminStaffUsers.find(user => user?._id?.toString() === sermon.adminStaffUserId?.toString());

//             // Fixed the problematic line to safely handle undefined values
//             const church = churches.find(ch =>
//                 ch && ch._id && sermon.churchId &&
//                 ch._id.toString() === sermon.churchId.toString()
//             );

//             const sermonListeners = usersListensLive.filter(userListen =>
//                 userListen.sermonId && sermon._id &&
//                 userListen.sermonId.toString() === sermon._id.toString()
//             );

//             const activeListeners = sermonListeners.filter(listener => listener.status === "Live");
//             const inactiveListeners = sermonListeners.filter(listener => listener.status === "End");

//             const listeners = sermonListeners.map(userListen => {
//                 const user = listeningUsers.find(user =>
//                     user && user._id && userListen.userId &&
//                     user._id.toString() === userListen.userId.toString()
//                 );

//                 const clickedJesus = jesusClicksLive.some(jc =>
//                     jc && jc.userId && jc.sermonId && userListen.userId && sermon._id &&
//                     jc.userId.toString() === userListen.userId.toString() &&
//                     jc.sermonId.toString() === sermon._id.toString()
//                 );

//                 return {
//                     userId: userListen.userId,
//                     userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
//                     userEmail: user ? user.email : 'Unknown',
//                     startDateTime: userListen.startDateTime || 'N/A',
//                     endDateTime: userListen.endDateTime || 'N/A',
//                     status: userListen.status,
//                     jesusClicked: clickedJesus
//                 };
//             });

//             return {
//                 sermonId: sermon._id,
//                 sermonName: sermon.sermonName,
//                 adminName: admin ? `${admin.firstName} ${admin.lastName}` : 'Unknown',
//                 churchName: church ? church.name : 'Unknown',
//                 SermonStartDateTime: sermon.startDateTime,
//                 sermonStatus: sermon.status,
//                 listeners: listeners,
//                 totalListeners: sermonListeners.length,
//                 activeListeners: activeListeners.length,
//                 inactiveListeners: inactiveListeners.length
//             };
//         });

//         res.status(200).json(sermonDetailsLive);
//     } catch (error) {
//         console.error("Error fetching live users and sermons:", error);
//         res.status(500).json({ message: 'Server error', error });
//     }
// };



// export const getAllUsers = async (req, res) => {
//     try {
//         console.log("Fetching users who have clicked Jesus...");


//         const jesusClickUsers = await JesusClick.aggregate([
//             {
//                 $group: {
//                     _id: "$userId",
//                     totalClicks: { $sum: "$count" } 
//                 }
//             }
//         ]);

//         if (jesusClickUsers.length === 0) {
//             return res.status(200).json({ message: "No users have clicked Jesus", data: [] });
//         }

//         // Step 2: Find users that match those userIds
//         const userIds = jesusClickUsers.map(user => user._id);
//         const users = await User.find(
//             { _id: { $in: userIds } },
//             { firstName: 1, lastName: 1, email: 1, phone: 1, address: 1, city: 1, state: 1, country: 1, churchId : 1 }
//         );

//         // Step 3: Attach click count to each user
//         const userData = users.map(user => {
//             const clickData = jesusClickUsers.find(jc => jc._id.toString() === user._id.toString());
//             return {
//                 ...user.toObject(),
//                 jesusClickCount: clickData ? clickData.totalClicks : 0 
//             };
//         });

//         res.status(200).json({ message: "Users who clicked Jesus fetched successfully", data: userData });
//     } catch (error) {
//         console.error("Error fetching users:", error);
//         res.status(500).json({ message: "Server error", error });
//     }
// };


export const getAllUsersListen = async (req, res) => {
    try {
        // console.log("Fetching users who listened with status 'End'...");

        const { churchId, userId } = req.query;

        // Step 1: Get initial user listens data with userId filter if provided
        const userListenQuery = { status: "End" };
        if (userId) {
            userListenQuery.userId = userId;
        }
        const usersListens = await UsersListen.find(userListenQuery).lean();

        if (usersListens.length === 0) {
            const message = userId ? "This user hasn't listened to any sermons yet" : "No users listened to any sermons yet";
            return res.status(200).json({ message, data: [] });
        }

        // Step 2: Extract unique IDs
        const sermonIds = [...new Set(usersListens.map(user => user.sermonId?.toString()).filter(Boolean))];
        const userIds = [...new Set(usersListens.map(user => user.userId?.toString()).filter(Boolean))];

        // Step 3: Build sermon query
        const sermonQuery = churchId
            ? { _id: { $in: sermonIds }, status: { $ne: "Live" }, churchId }
            : { _id: { $in: sermonIds }, status: { $ne: "Live" } };

        const sermons = await Sermon.find(sermonQuery).lean();

        // Step 4: Extract IDs for related queries
        const adminStaffIds = [...new Set(sermons.map(sermon => sermon.adminStaffUserId?.toString()).filter(Boolean))];
        const churchIds = [...new Set(sermons.map(sermon => sermon.churchId?.toString()).filter(Boolean))];

        // Step 5: Run all related queries in parallel
        const [adminStaffUsers, listeningUsers, churches, jesusClicks] = await Promise.all([
            User.find({ _id: { $in: adminStaffIds } }, { firstName: 1, lastName: 1, email: 1, phone: 1 }).lean(),
            User.find({ _id: { $in: userIds } }, { firstName: 1, lastName: 1, email: 1, phone: 1 }).lean(),
            Church.find({ _id: { $in: churchIds } }, { name: 1, address: 1, city: 1, state: 1, country: 1, senior_pastor_name: 1 }).lean(),
            JesusClick.find({ userId: { $in: userIds } }).lean()
        ]);

        // Step 6: Create lookup maps for O(1) access
        const adminStaffMap = new Map(adminStaffUsers.map(user => [user._id.toString(), user]));
        const listeningUsersMap = new Map(listeningUsers.map(user => [user._id.toString(), user]));
        const churchesMap = new Map(churches.map(church => [church._id.toString(), church]));

        // Create Jesus clicks lookup for faster checking
        const jesusClicksSet = new Set(jesusClicks.map(jc => `${jc.userId}_${jc.sermonId}`));

        // Step 7: Process sermon details with simplified session handling
        const sermonDetails = sermons
            .map(sermon => {
                const admin = adminStaffMap.get(sermon.adminStaffUserId?.toString());
                const church = churchesMap.get(sermon.churchId?.toString());

                // Get all listening sessions for this sermon
                const sermonListeners = usersListens
                    .filter(userListen => userListen.sermonId?.toString() === sermon._id?.toString());

                // Simplified processing - no complex session merging
                // Group by userId to get only one session per user per sermon
                const userSessionsMap = {};
                sermonListeners.forEach(userListen => {
                    const userId = userListen.userId?.toString();
                    if (!userSessionsMap[userId]) {
                        userSessionsMap[userId] = userListen; // Store only first session
                    }
                });

                // Process only unique users (one session per user per sermon)
                const listeners = Object.values(userSessionsMap)
                    .map(userListen => {
                        const user = listeningUsersMap.get(userListen.userId?.toString());
                        if (!user) return null;

                        // Check Jesus click efficiently
                        const jesusClickKey = `${userListen.userId}_${sermon._id.toString()}`;
                        const clickedJesus = jesusClicksSet.has(jesusClickKey);

                        return {
                            userId: userListen.userId?.toString(),
                            userName: `${user.firstName} ${user.lastName || ''}`.trim(),
                            userEmail: user.email,
                            userPhone: user.phone || '',
                            startDateTime: userListen.startDateTime || 'N/A',
                            endDateTime: userListen.endDateTime || 'N/A',
                            jesusClicked: clickedJesus
                        };
                    })
                    .filter(listener => listener !== null);

                return {
                    sermonId: sermon._id,
                    sermonName: sermon.sermonName || sermon.broadcast_id || 'Live Broadcast',
                    adminName: admin ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Unknown',
                    adminPhone: admin ? admin.phone : 'Unknown',
                    SermonStartDateTime: sermon.startDateTime,
                    churchName: church ? church.name : 'Unknown',
                    listeners: listeners
                };
            })
            .filter(sermonDetail => sermonDetail.listeners.length > 0);

        if (sermonDetails.length === 0) {
            const message = userId ? "No sermons found for this user" : "No sermons with valid listeners found";
            return res.status(200).json({ message, data: [] });
        }

        // Sort by sermon start time
        sermonDetails.sort((a, b) => new Date(b.SermonStartDateTime) - new Date(a.SermonStartDateTime));

        res.status(200).json(sermonDetails);
    } catch (error) {
        console.error("Error fetching users and sermons:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

export const getLiveUsersListen = async (req, res) => {
    try {
        const { churchId } = req.query;


        // Get all live sermons first, regardless of listeners
        const allLiveSermons = await Sermon.find({
            status: "Live",
            ...(churchId ? { churchId } : {})
        }).lean();

        if (allLiveSermons.length === 0) {
            return res.status(200).json([]);
        }

        // Get listeners for all sermons (including those with no listeners)
        const usersListensLive = await UsersListen.find({ status: { $in: ["Live", "End"] } }).lean();

        const sermonIdsLive = allLiveSermons.map(sermon => sermon._id.toString());
        const userIdsLive = [...new Set(usersListensLive.map(user => user.userId?.toString()).filter(Boolean))];


        const allSermons = allLiveSermons;


        if (!allSermons.length) {
            return res.status(200).json([]);
        }


        const endedSermons = allSermons.filter(sermon => sermon.status === "End");
        if (endedSermons.length > 0) {
            const bulkOps = endedSermons.map(sermon => ({
                updateMany: {
                    filter: { sermonId: sermon._id, status: "Live" },
                    update: { $set: { endDateTime: sermon.endDateTime, status: "End" } }
                }
            }));


            UsersListen.bulkWrite(bulkOps).catch(err =>
                console.error("Bulk update error:", err)
            );
        }


        const sermonsLive = allSermons;


        const liveSermonIds = new Set(sermonsLive.map(s => s._id.toString()));
        const liveUserIds = new Set(
            usersListensLive
                .filter(ul => ul.sermonId && liveSermonIds.has(ul.sermonId.toString()))
                .map(ul => ul.userId?.toString())
                .filter(Boolean)
        );
        const adminStaffIdsLive = new Set(
            sermonsLive
                .map(s => s.adminStaffUserId?.toString())
                .filter(Boolean)
        );
        const churchIdsLive = new Set(
            sermonsLive
                .map(s => s.churchId?.toString())
                .filter(Boolean)
        );


        const [adminStaffUsers, listeningUsers, churches, jesusClicksLive] = await Promise.all([
            User.find(
                { _id: { $in: Array.from(adminStaffIdsLive) } },
                { firstName: 1, lastName: 1, email: 1 }
            ).lean(),
            User.find(
                { _id: { $in: Array.from(liveUserIds) } },
                { firstName: 1, lastName: 1, email: 1 }
            ).lean(),
            Church.find(
                { _id: { $in: Array.from(churchIdsLive) } },
                { name: 1, address: 1, city: 1, state: 1, country: 1, senior_pastor_name: 1 }
            ).lean(),
            JesusClick.find({ userId: { $in: Array.from(liveUserIds) } }).lean()
        ]);

        // Step 5: Create lookup maps for O(1) access
        const adminStaffMap = new Map(
            adminStaffUsers.map(user => [user._id.toString(), user])
        );
        const listeningUsersMap = new Map(
            listeningUsers.map(user => [user._id.toString(), user])
        );
        const churchesMap = new Map(
            churches.map(church => [church._id.toString(), church])
        );
        const jesusClicksSet = new Set(
            jesusClicksLive.map(jc => `${jc.userId}_${jc.sermonId}`)
        );


        const relevantUserListens = usersListensLive.filter(ul =>
            ul.sermonId && liveSermonIds.has(ul.sermonId.toString())
        );


        const sermonDetailsLive = sermonsLive.map(sermon => {
            const sermonIdStr = sermon._id.toString();
            const admin = adminStaffMap.get(sermon.adminStaffUserId?.toString());
            const church = churchesMap.get(sermon.churchId?.toString());


            const sermonListeners = relevantUserListens.filter(ul =>
                ul.sermonId?.toString() === sermonIdStr
            );


            const userSessionsMap = new Map();

            sermonListeners.forEach(userListen => {
                const userId = userListen.userId?.toString();
                if (!userId) return;

                if (!userSessionsMap.has(userId)) {
                    userSessionsMap.set(userId, []);
                }
                userSessionsMap.get(userId).push(userListen);
            });


            let activeListenersCount = 0;
            let inactiveListenersCount = 0;


            const listeners = Array.from(userSessionsMap.entries())
                .map(([userId, userSessions]) => {
                    const user = listeningUsersMap.get(userId);
                    if (!user) return null;


                    userSessions.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

                    const firstStartTime = userSessions[0].startDateTime;
                    const latestSession = userSessions[userSessions.length - 1];
                    const currentStatus = latestSession.status;
                    const latestEndTime = latestSession.endDateTime;


                    if (currentStatus === "Live") {
                        activeListenersCount++;
                    } else {
                        inactiveListenersCount++;
                    }

                    const jesusClickKey = `${userId}_${sermonIdStr}`;
                    const clickedJesus = jesusClicksSet.has(jesusClickKey);

                    return {
                        userId: userId,
                        userName: `${user.firstName} ${user.lastName || ''}`.trim(),
                        userEmail: user.email,
                        startDateTime: firstStartTime || 'N/A',
                        endDateTime: latestEndTime || 'N/A',
                        status: currentStatus,
                        jesusClicked: clickedJesus
                    };
                })
                .filter(Boolean);

            return {
                sermonId: sermon._id,
                sermonName: sermon.sermonName,
                adminName: admin ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Unknown',
                churchName: church ? church.name : 'Unknown',
                SermonStartDateTime: sermon.startDateTime,
                broadcast_id: sermon.broadcast_id,
                sermonStatus: sermon.status,
                listeners: listeners,
                totalListeners: listeners.length,
                activeListeners: activeListenersCount,
                inactiveListeners: inactiveListenersCount
            };
        });

        res.status(200).json(sermonDetailsLive);
    } catch (error) {
        console.error("Error fetching live users and sermons:", error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};



export const getAllUsers = async (req, res) => {
    try {
        console.log("Fetching users who have clicked Jesus...");

        const { churchId } = req.query;

        const jesusClickUsers = await JesusClick.aggregate([
            {
                $group: {
                    _id: "$userId",
                    totalClicks: { $sum: "$count" }
                }
            }
        ]);

        if (jesusClickUsers.length === 0) {
            return res.status(200).json({ message: "No users have clicked Jesus", data: [] });
        }


        const userIds = jesusClickUsers.map(user => user._id);
        let query = { _id: { $in: userIds } };

        if (churchId && mongoose.Types.ObjectId.isValid(churchId)) {
            query.churchId = new mongoose.Types.ObjectId(churchId);
        } else if (churchId) {
            return res.status(400).json({ message: "Invalid churchId format" });
        }


        const users = await User.find(
            query,
            { firstName: 1, lastName: 1, email: 1, phone: 1, address: 1, city: 1, state: 1, country: 1, churchId: 1 }
        ).sort({ created_at: -1 })
            .lean();


        const clickDataMap = new Map(
            jesusClickUsers.map(jc => [jc._id.toString(), jc.totalClicks])
        );


        const userData = users.map(user => ({
            ...user,
            jesusClickCount: clickDataMap.get(user._id.toString()) || 0
        }));

        if (userData.length === 0) {
            const message = churchId
                ? `No users found for churchId ${churchId} who clicked Jesus`
                : "No users found who clicked Jesus";
            return res.status(200).json({ message, data: [] });
        }

        res.status(200).json({ message: "Users who clicked Jesus fetched successfully", data: userData });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};




export const getUsersListenById = async (req, res) => {
    try {
        const usersListen = await UsersListen.findById(req.params.id).populate('churchId sermonId');
        if (!usersListen) return res.status(404).json({ message: 'Entry not found' });
        res.status(200).json(usersListen);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




export const deleteUsersListen = async (req, res) => {
    try {
        const deletedUsersListen = await UsersListen.findByIdAndDelete(req.params.id);
        if (!deletedUsersListen) return res.status(404).json({ message: 'Entry not found' });
        res.status(200).json({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const convertUsersListenDates = async (req, res) => {
    try {
        // Get all usersListen records
        const usersListens = await UsersListen.find({}).lean();
        console.log(`Found ${usersListens.length} total usersListen records to process`);

        let convertedCount = 0;
        let logSamples = 0;

        // Process each usersListen record
        for (const userListen of usersListens) {
            // Log some sample data to understand the structure
            if (logSamples < 3) {
                console.log('Sample usersListen data:');
                console.log('ID:', userListen._id);
                console.log('startDateTime type:', typeof userListen.startDateTime);
                console.log('startDateTime value:', userListen.startDateTime);
                console.log('endDateTime type:', typeof userListen.endDateTime);
                console.log('endDateTime value:', userListen.endDateTime);
                logSamples++;
            }

            let needsUpdate = false;

            // Check if startDateTime is in ISO format (contains T) or is a Date object
            if (userListen.startDateTime &&
                (typeof userListen.startDateTime === 'string' && userListen.startDateTime.includes('T')) ||
                (typeof userListen.startDateTime === 'object' && userListen.startDateTime instanceof Date)) {

                try {
                    const dateObj = new Date(userListen.startDateTime);
                    if (!isNaN(dateObj.getTime())) { // Ensure it's a valid date
                        const formattedDate = formatDateToString(dateObj);

                        // Update the document directly in the database
                        await UsersListen.updateOne(
                            { _id: userListen._id },
                            { $set: { startDateTime: formattedDate } }
                        );

                        needsUpdate = true;
                        console.log(`Converted startDateTime for usersListen ${userListen._id} from ${userListen.startDateTime} to ${formattedDate}`);
                    }
                } catch (err) {
                    console.error(`Error processing startDateTime for usersListen ${userListen._id}:`, err);
                }
            }

            // Check if endDateTime is in ISO format (contains T) or is a Date object
            if (userListen.endDateTime &&
                (typeof userListen.endDateTime === 'string' && userListen.endDateTime.includes('T')) ||
                (typeof userListen.endDateTime === 'object' && userListen.endDateTime instanceof Date)) {

                try {
                    const dateObj = new Date(userListen.endDateTime);
                    if (!isNaN(dateObj.getTime())) { // Ensure it's a valid date
                        const formattedDate = formatDateToString(dateObj);

                        // Update the document directly in the database
                        await UsersListen.updateOne(
                            { _id: userListen._id },
                            { $set: { endDateTime: formattedDate } }
                        );

                        needsUpdate = true;
                        console.log(`Converted endDateTime for usersListen ${userListen._id} from ${userListen.endDateTime} to ${formattedDate}`);
                    }
                } catch (err) {
                    console.error(`Error processing endDateTime for usersListen ${userListen._id}:`, err);
                }
            }

            if (needsUpdate) {
                convertedCount++;
            }
        }

        return res.status(200).json({
            success: true,
            message: `Successfully converted dates for ${convertedCount} usersListen records`,
            totalProcessed: usersListens.length
        });

    } catch (error) {
        console.error('Error converting usersListen dates:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to convert usersListen dates',
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






export const getLiveSermonsSummary = async (req, res) => {
    try {
        const { churchId } = req.query;

        // 1️⃣ Get live sermons - filter by churchId if provided, otherwise get ALL
        const liveSermonQuery = churchId
            ? { status: "Live", churchId: new mongoose.Types.ObjectId(churchId) }
            : { status: "Live" };  // ALL churches

        const liveSermons = await Sermon.find(liveSermonQuery, {
            _id: 1,
            startDateTime: 1,
            churchId: 1
        }).lean();

        // Calculate total live churches
        const totalLiveNowChurchs = new Set(
            liveSermons.map(s => s.churchId.toString())
        ).size;


        if (!liveSermons.length) {
            if (!liveSermons.length) {
                return res.status(200).json({
                    totalLiveNowChurchs: 0, // always 0 if no live sermons
                    sermons: []
                });
            }
        }

        // 2️⃣ Get church details for live sermons
        const churchIds = [...new Set(liveSermons.map(s => s.churchId.toString()))];
        const churches = await Church.find(
            { _id: { $in: churchIds } },
            { name: 1 }
        ).lean();

        // 3️⃣ Get active listeners count for each live sermon
        const sermonIds = liveSermons.map(s => s._id);
        const activeListeners = await UsersListen.aggregate([
            {
                $match: {
                    sermonId: { $in: sermonIds },
                    status: "Live"
                }
            },
            {
                $group: {
                    _id: {
                        sermonId: "$sermonId",
                        userId: "$userId"
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.sermonId",
                    activeCount: { $sum: 1 }
                }
            }
        ]);


        // 4️⃣ Create lookup maps
        const churchMap = new Map(churches.map(c => [c._id.toString(), c.name]));
        const activeListenersMap = new Map(
            activeListeners.map(al => [al._id.toString(), al.activeCount])
        );

        // 5️⃣ Build response
        const sermonsSummary = liveSermons.map(sermon => ({
            churchName: churchMap.get(sermon.churchId.toString()) || 'Unknown',
            startTime: sermon.startDateTime,
            activeUsers: activeListenersMap.get(sermon._id.toString()) || 0
        }));

        res.status(200).json({
            totalLiveNowChurchs,
            sermons: sermonsSummary
        });
    } catch (error) {
        console.error("Error fetching live sermons summary:", error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

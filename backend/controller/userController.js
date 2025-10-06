import User from '../model/authModel.js';
import Church from '../model/churchModel.js';
import bcrypt from 'bcryptjs';
import DeleteRequest from '../model/deleteRequest.js';
import JesusClick from "../model/jeasusClicked.js";
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateUniqueReferralCode = async () => {
  let referralCode;
  let isUnique = false;

  while (!isUnique) {
    referralCode = generateReferralCode();
    const existingUser = await User.findOne({ referralCode });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return referralCode;
};

export const addUser = async (req, res) => {
  console.log('Request Body:', req.body);

  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      image,

      jobTitle,
      department,
      employmentType,
      startDate,
      endDate,
      workLocation,
      workEmail,

      userRole,
      systemAccessLevel,
      assignedTeams,

      educationLevel,
      certifications,
      skills,
      languagesSpoken,

      employeeId,
      salaryOrHourlyRate,
      payrollBankDetails,
      tfnAbn,
      workVisaStatus,

      emergencyContact,
      linkedinProfile,
      notesAndComments,

      address,
      country,
      state,
      city,
      suburb,
      pincode,

      type,
      status,
      termAgreement,
      attendedBefore,
      referredBy,
      faithLevel,
      language,
      referralSource,

      churchId,
      created_at,
      updated_at
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    if (referredBy) {
      const referrer = await User.findOne({ referralCode: referredBy });
      if (!referrer) {
        return res.status(400).json({ error: 'Invalid referral code' });
      }
    }


    const formatEmail = (email) => {
      if (!email) return '';
      return email.toLowerCase();
    };

    const referralCode = await generateUniqueReferralCode();

    const newUserData = {
      firstName,
      lastName,
      email: formatEmail(email),
      type,
      address,
      country,
      phone,
      image,
      suburb,
      termAgreement,
      attendedBefore: attendedBefore || "Yes",
      referralCode,
      referredBy,
      faithLevel: faithLevel || "Strong faith",
      pincode,
      churchId,
      state,
      city,
      status,
      jobTitle,
      department,
      employmentType,
      language: language || "english",
      startDate,
      endDate,
      workLocation,
      workEmail,
      userRole,
      systemAccessLevel,
      assignedTeams,
      educationLevel,
      certifications,
      skills,
      languagesSpoken,
      employeeId,
      salaryOrHourlyRate,
      payrollBankDetails,
      referralSource: referralSource || "church_event",
      tfnAbn,
      workVisaStatus,
      emergencyContact,
      linkedinProfile,
      notesAndComments,
      created_at,
      updated_at
    };

    if (password) {
      newUserData.password = await bcrypt.hash(password, 10);
    }

    const newUser = new User(newUserData);
    console.log("newUser", newUser);

    // Save the user to the database
    const savedUser = await newUser.save();

    // Create a user object without the password
    const userWithoutPassword = {
      _id: savedUser._id,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      address: savedUser.address,
      country: savedUser.country,
      phone: savedUser.phone,
      image: savedUser.image,
      suburb: savedUser.suburb,
      pincode: savedUser.pincode,
      churchId: savedUser.churchId,
      state: savedUser.state,
      city: savedUser.city,
      status: savedUser.status,
      jobTitle: savedUser.jobTitle,
      department: savedUser.department,
      employmentType: savedUser.employmentType,
      startDate: savedUser.startDate,
      endDate: savedUser.endDate,
      workLocation: savedUser.workLocation,
      workEmail: savedUser.workEmail,
      userRole: savedUser.userRole,
      systemAccessLevel: savedUser.systemAccessLevel,
      assignedTeams: savedUser.assignedTeams,
      educationLevel: savedUser.educationLevel,
      certifications: savedUser.certifications,
      skills: savedUser.skills,
      languagesSpoken: savedUser.languagesSpoken,
      employeeId: savedUser.employeeId,
      salaryOrHourlyRate: savedUser.salaryOrHourlyRate,
      payrollBankDetails: savedUser.payrollBankDetails,
      tfnAbn: savedUser.tfnAbn,
      referralCode: savedUser.referralCode,
      faithLevel: savedUser.faithLevel,
      referralSource: savedUser.referralSource,
      referredBy: savedUser.referredBy,
      language: savedUser.language,
      workVisaStatus: savedUser.workVisaStatus,
      emergencyContact: savedUser.emergencyContact,
      linkedinProfile: savedUser.linkedinProfile,
      notesAndComments: savedUser.notesAndComments,
      created_at: savedUser.created_at,
      updated_at: savedUser.updated_at
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const countUserByType = async (req, res) => {
  try {
    const userType = req.params.type;
    const churchId = req.query.churchId;

    console.log(`Counting users of type: ${userType}`);
    console.log(`Church ID: ${churchId}`);

    const validChurches = await Church.find({}, '_id');
    const validChurchIds = validChurches.map(church => church._id.toString());

    // Build the query object
    let query = {
      type: userType,
      churchId: { $in: validChurchIds }
    };


    if (churchId) {
      if (!validChurchIds.includes(churchId)) {
        return res.status(404).json({ message: 'Invalid church ID' });
      }
      query.churchId = churchId;
    }


    const totalCount = await User.countDocuments(query);

    res.status(200).json({ message: 'Count retrieved successfully', totalCount });
  } catch (error) {
    console.error("Error fetching user count:", error);
    res.status(500).json({ message: error.message });
  }
};



export const fetchAllUser = async (req, res) => {
  try {
    console.log('Fetching users with non-null and existing churchId');

    const users = await User.find({ churchId: { $ne: null, $exists: true } })
      .select('-password')
      .populate('churchId', 'name')
      .sort({ created_at: -1 });

    console.log('Raw users fetched:', users.length, 'users');
    console.log('Users:', JSON.stringify(users, null, 2));

    const filteredUsers = users.filter(user => user.churchId !== null);

    console.log('Filtered users (after removing null churchId):', filteredUsers.length, 'users');
    console.log('Filtered users:', JSON.stringify(filteredUsers, null, 2));

    res.json(filteredUsers);
  } catch (error) {
    console.error('Error fetching users:', error.message, error.stack);
    res.status(500).json({ message: error.message });
  }
};





export const fetchUserType = async (req, res) => {
  try {
    const userType = req.params.type;
    const { churchId } = req.query;

    console.log(`Fetching users with type "${userType}" and non-null churchId`);


    let query = { type: userType };


    if (churchId) {
      query.churchId = churchId;
    } else {
      query.churchId = { $ne: null, $exists: true };
    }

    const users = await User.find(query)
      .select('-password')
      .populate('churchId', 'name')
      .sort({ created_at: -1 });

    console.log(`Users with type "${userType}" fetched:`, users.length, 'users');


    const filteredUsers = users.filter(user => user.churchId !== null);

    console.log(`Users with non-null churchId:`, filteredUsers.length, 'users');


    res.json(filteredUsers);
  }
  catch (error) {
    console.error(`Error fetching users by type "${req.params.type}":`, error.message, error.stack);
    res.status(500).json({ message: error.message });
  }
};



export const detailUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch user by ID and exclude the 'password' field
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const fullUrl = `${req.protocol}://${req.get("host")}`;

    let referredByName = null;

    if (user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy }).select("firstName lastName");
      if (referrer) {
        referredByName = `${referrer.firstName || ""} ${referrer.lastName || ""}`.trim();
      }
    }

    const jesusClick = await JesusClick.findOne({ userId: id }).sort({ createdAt: -1 });

    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      image: user.image ? `${fullUrl}/${user.image.replace(/^\/?/, '')}` : null,
      jobTitle: user.jobTitle,
      department: user.department,
      employmentType: user.employmentType,
      startDate: user.startDate,
      endDate: user.endDate,
      workLocation: user.workLocation,
      workEmail: user.workEmail,
      userRole: user.userRole,
      systemAccessLevel: user.systemAccessLevel,
      assignedTeams: user.assignedTeams,
      educationLevel: user.educationLevel,
      certifications: user.certifications,
      skills: user.skills,
      languagesSpoken: user.languagesSpoken,
      employeeId: user.employeeId,
      salaryOrHourlyRate: user.salaryOrHourlyRate,
      payrollBankDetails: user.payrollBankDetails,
      tfnAbn: user.tfnAbn,
      workVisaStatus: user.workVisaStatus,
      emergencyContact: user.emergencyContact,
      linkedinProfile: user.linkedinProfile,
      notesAndComments: user.notesAndComments,
      address: user.address,
      country: user.country,
      state: user.state,
      city: user.city,
      suburb: user.suburb,
      pincode: user.pincode,
      type: user.type,
      status: user.status,
      referralSource: user.referralSource || null,
      language: user.language || null,
      termAgreement: user.termAgreement,
      attendedBefore: user.attendedBefore,
      referralCode: user.referralCode,
      referredBy: referredByName,
      faithLevel: user.faithLevel,
      created_at: user.created_at,
      updated_at: user.updated_at,
      churchId: user.churchId,
      acceptedJesus: jesusClick ? "Yes" : "No",
      acceptedJesusAt: jesusClick ? jesusClick.createdAt : null,
      LastacceptedJesusAt: jesusClick ? jesusClick.updatedAt : null,
      jesusClickCount: jesusClick ? jesusClick.count : 0,
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(400).json({ error: error.message });
  }
};




export const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    // If the password is being updated, hash it
    if (updateFields.password) {
      updateFields.password = await bcrypt.hash(updateFields.password, 10);
    }

    // Update only the fields provided in the request
    const updatedUser = await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password from the updated user object before sending it in the response
    const { password, ...userWithoutPassword } = updatedUser.toObject();

    res.status(200).json({ message: 'User updated successfully', user: userWithoutPassword });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Delete the user
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare the update object
    const updateData = {
      userId: id,
      status: 'approved',
      createdAt: new Date(),
    };

    // Add reason only if it's a non-empty string
    if (typeof reason === 'string' && reason.trim() !== '') {
      updateData.reason = reason.trim();
    }

    await DeleteRequest.findOneAndUpdate(
      { userId: id },
      updateData,
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'User deleted and deletion request approved',
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(400).json({ error: error.message || 'Failed to delete user' });
  }
};



export const requestDeleteUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    // Validate input
    if (!userId || !reason) {
      return res.status(400).json({ error: 'User ID and reason are required' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if a deletion request already exists for this user
    const existingRequest = await DeleteRequest.findOne({ userId, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ error: 'A deletion request is already pending for this account' });
    }

    // Create a new deletion request
    const deleteRequest = new DeleteRequest({
      userId,
      reason,
    });

    await deleteRequest.save();

    res.status(201).json({ message: 'Deletion request submitted successfully' });
  } catch (error) {
    console.error('Error in requestDeleteUser:', error);
    res.status(500).json({ error: error.message || 'Server error while submitting deletion request' });
  }
};

export const getDeleteRequests = async (req, res) => {
  try {
    const requests = await DeleteRequest.find().populate('userId', 'email firstName lastName'); // Optional: populate user details
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching delete requests:', error);
    res.status(500).json({ error: error.message || 'Server error while fetching deletion requests' });
  }
};

export const updateDeleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    // Check if status is valid
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use "approved" or "rejected"' });
    }

    // Find the delete request
    const request = await DeleteRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Deletion request not found' });
    }

    // Update the status of the request
    request.status = status;
    await request.save();

    // If the request is approved, delete the associated user
    if (status === 'approved' && request.userId) {
      const deletedUser = await User.findByIdAndDelete(request.userId);
      if (!deletedUser) {
        return res.status(404).json({ error: 'User not found while deleting after approval' });
      }
      return res.status(200).json({
        message: 'Request approved and user deleted successfully',
      });
    }

    // If rejected, just return success message
    res.status(200).json({ message: `Request ${status} successfully` });
  } catch (error) {
    console.error('Error updating delete request:', error);
    res.status(500).json({
      error: error.message || 'Server error while updating deletion request',
    });
  }
};



export const getDeleteRequestStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const request = await DeleteRequest.findOne({ userId }).sort({ requestedAt: -1 }); // Get latest request
    if (!request) {
      return res.status(200).json({ status: null }); // No request found
    }
    res.status(200).json({ status: request.status });
  } catch (error) {
    console.error('Error fetching delete request status:', error);
    res.status(500).json({ error: error.message || 'Server error while fetching request status' });
  }
};




export const requestResetPassword = async (req, res) => {
  const { email } = req.body;

  try {

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    if (user) {
      const resetCode = Math.floor(1000 + Math.random() * 9000).toString();


      user.resetCode = resetCode;
      user.resetCodeExpires = Date.now() + 3600000;
      await user.save();


      await sendResetEmail(email, resetCode);


      return res.status(200).json({
        message: 'A 4-digit reset code has been sent to your email.',

        code: resetCode
      });
    }


    res.status(200).json({ message: 'No account found with this email.' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

const sendResetEmail = async (email, resetCode) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Password Reset Code',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #231f20;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .header h2 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
            text-align: center;
          }
          .code-box {
            background-color: #f8f8f8;
            border: 2px dashed #231f20;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            display: inline-block;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #231f20;
            letter-spacing: 5px;
          }
          .instructions {
            font-size: 16px;
            line-height: 1.6;
            color: #666;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #888;
          }
          .button {
            display: inline-block;
            padding: 12px 25px;
            background-color: #231f20;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 20px;
          }
          .button:hover {
            background-color: #3a3335;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p class="instructions">
              You have requested to reset your password. Please use the 4-digit code below to proceed:
            </p>
            <div class="code-box">
              <span class="code">${resetCode}</span>
            </div>
            <p class="instructions">
              This code is valid for <strong>1 hour</strong>. Enter it in the reset password form to set a new password.
            </p>
            <p class="instructions">
              If you didn’t request this, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Church Translator. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:adasilva@simpleit4u.com.au">adasilva@simpleit4u.com.au</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};


export const verifyResetCodeAndChangePassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetCode: code,
      resetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset code.'
      });
    }

    // Check if new password matches the current password
    const isMatch = await bcrypt.compare(newPassword, user.password);
    if (isMatch) {
      return res.status(400).json({
        message: 'New password cannot be the same as your current password. Please choose a different password.'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset code fields
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: 'Password updated successfully. You can now log in.'
    });
  } catch (error) {
    console.error('Error verifying code and changing password:', error);
    res.status(500).json({
      message: 'Server error. Please try again later.'
    });
  }
};




export const getReferralReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      type: "4",
      referredBy: {
        $exists: true,
        $ne: "",
        $ne: null,
        $regex: /^.+$/
      }
    };

    const totalReferrals = await User.countDocuments(query);

    const referredUsers = await User.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`Page ${page}: Found ${referredUsers.length} users out of ${totalReferrals} total`);

    if (totalReferrals === 0) {
      return res.json({
        totalReferrals: 0,
        users: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false
        },
        message: 'No users with valid referral codes found'
      });
    }

    const totalPages = Math.ceil(totalReferrals / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const recentSignups = await Promise.all(
      referredUsers.map(async (user, idx) => {
        try {
          const referrer = await User.findOne({
            referralCode: user.referredBy.trim()
          });

          return {
            id: skip + idx + 1,
            referrerName: referrer
              ? `${referrer.firstName} ${referrer.lastName}`.trim()
              : 'Unknown Referrer',
            referredName: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            referralCode: user.referredBy,
            suburb: user.suburb,
            churchId: user.churchId,
            faithLevel: user.faithLevel,
            language: user.language,
            date: new Date(user.created_at).toISOString().split('T')[0],
          };
        } catch (error) {
          console.error(`Error processing user ${user._id}:`, error);
          return {
            id: skip + idx + 1,
            referrerName: 'Error',
            referredName: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            referralCode: user.referredBy,
            suburb: user.suburb || '',
            churchId: user.churchId || '',
            faithLevel: user.faithLevel || '',
            language: user.language || '',
            date: new Date(user.created_at).toISOString().split('T')[0],
          };
        }
      })
    );

    return res.json({
      totalReferrals,
      recentSignups,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalReferrals,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    });

  } catch (error) {
    console.error('getReferralReport error:', error);
    res.status(500).json({
      message: 'Error fetching referral report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const getReferralStats = async (req, res) => {
  try {
    const { referralCode } = req.params;

    if (!referralCode) {
      return res.status(400).json({
        message: 'Referral code is required',
        success: false
      });
    }

    const referrer = await User.findOne({
      referralCode: referralCode.trim()
    });

    if (!referrer) {
      return res.status(404).json({
        message: 'Referral code not found',
        success: false
      });
    }

    const referralCount = await User.countDocuments({
      referredBy: referralCode.trim(),
      type: "4"
    });

    const recentSignups = await User.find({
      referredBy: referralCode.trim(),
      type: "4"
    })
      .select('firstName lastName email created_at suburb faithLevel language')
      .sort({ created_at: -1 })
      .lean();

    const referredUsersData = recentSignups.map((user, index) => ({
      id: index + 1,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      suburb: user.suburb || '',
      faithLevel: user.faithLevel || '',
      language: user.language || '',
      registrationDate: new Date(user.created_at).toISOString().split('T')[0]
    }));

    return res.json({
      totalReferrals: referralCount,
      recentSignups: referredUsersData,
    });

  } catch (error) {
    console.error('getReferralStats error:', error);
    res.status(500).json({
      message: 'Error fetching referral statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      success: false
    });
  }
};
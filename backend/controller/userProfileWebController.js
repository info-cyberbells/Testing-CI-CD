import User from '../model/authModel.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';

// Set up storage for uploaded images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Append unique name to the file
    }
});

// Initialize multer with the storage settings
const upload = multer({ storage: storage });

// View Profile
export const viewProfileWeb = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Return user details excluding the password
        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                address: user.address,
                country: user.country,
                phone: user.phone,
                pincode: user.pincode,
                state: user.state,
                city: user.city,
                type: user.type,
                status: user.status,
                image: user.image // Return the user's image
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Profile (with image upload)

export const updateProfileWeb = async (req, res) => {
    try {
        const userId = req.params.id;
        const {
            firstName, lastName, email, address, country, phone, pincode, state, suburb, type, status,
            gender, jobTitle, department, employmentType, startDate, endDate, workLocation, workEmail,
            userRole, systemAccessLevel, assignedTeams, educationLevel, certifications, skills, languagesSpoken,
            employeeId, salaryOrHourlyRate, payrollBankDetails, tfnAbn, workVisaStatus, emergencyContact,
            linkedinProfile, notesAndComments, city, termAgreement, attendedBefore, referralCode, referredBy, faithLevel, churchId
        } = req.body;

        // Handle the image upload
        let imagePath;
        if (req.file) {
            const fullUrl = req.protocol + '://' + req.get('host'); // Get full URL (http://localhost:5500)
            imagePath = `${fullUrl}/uploads/${req.file.filename}`; // Save full path in the database
        }

        // Update the user profile, including the image path if provided
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                firstName, lastName, email, address, country, phone, pincode, state, suburb, type, status, jobTitle, department, employmentType, startDate, endDate, workLocation, workEmail,
                userRole, systemAccessLevel, assignedTeams, educationLevel, certifications, skills, languagesSpoken,
                employeeId, salaryOrHourlyRate, payrollBankDetails, tfnAbn, workVisaStatus, emergencyContact,
                linkedinProfile, notesAndComments, city, termAgreement, attendedBefore, referralCode, referredBy, faithLevel, churchId,

                ...(imagePath && { image: imagePath }) // Only update the image if provided
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send back all user fields in the response
        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                address: updatedUser.address,
                country: updatedUser.country,
                phone: updatedUser.phone,
                pincode: updatedUser.pincode,
                state: updatedUser.state,
                suburb: updatedUser.suburb,
                type: updatedUser.type,
                status: updatedUser.status,
                jobTitle: updatedUser.jobTitle,
                department: updatedUser.department,
                employmentType: updatedUser.employmentType,
                startDate: updatedUser.startDate,
                endDate: updatedUser.endDate,
                workLocation: updatedUser.workLocation,
                workEmail: updatedUser.workEmail,
                userRole: updatedUser.userRole,
                systemAccessLevel: updatedUser.systemAccessLevel,
                assignedTeams: updatedUser.assignedTeams,
                educationLevel: updatedUser.educationLevel,
                certifications: updatedUser.certifications,
                skills: updatedUser.skills,
                languagesSpoken: updatedUser.languagesSpoken,
                employeeId: updatedUser.employeeId,
                salaryOrHourlyRate: updatedUser.salaryOrHourlyRate,
                payrollBankDetails: updatedUser.payrollBankDetails,
                tfnAbn: updatedUser.tfnAbn,
                workVisaStatus: updatedUser.workVisaStatus,
                emergencyContact: updatedUser.emergencyContact,
                linkedinProfile: updatedUser.linkedinProfile,
                notesAndComments: updatedUser.notesAndComments,
                city: updatedUser.city,
                termAgreement: updatedUser.termAgreement,
                attendedBefore: updatedUser.attendedBefore,
                referralCode: updatedUser.referralCode,
                referredBy: updatedUser.referredBy,
                faithLevel: updatedUser.faithLevel,
                churchId: updatedUser.churchId,
                image: updatedUser.image // Include the image path in the response
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};



// Change Password
export const changePasswordWeb = async (req, res) => {
    try {
        const userId = req.params.id;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ message: 'Invalid current password' });
        }


        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(
            userId,
            {
                password: hashedPassword,
                updated_at: new Date()
            },
            {
                runValidators: false
            }
        );

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Route handler for uploading profile image (for updating profile)
export const uploadProfileImageWeb = upload.single('image'); // Middleware to handle single image upload

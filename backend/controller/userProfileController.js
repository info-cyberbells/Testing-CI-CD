import User from '../model/authModel.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer with appropriate file size limit and error handling
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Export multer middleware with proper configuration
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
        fieldSize: 5 * 1024 * 1024 // 5MB field size limit 
    },
    fileFilter: fileFilter
});

// View Profile
export const viewProfile = async (req, res) => {
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
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                address: user.address,
                country: user.country,
                phone: user.phone,
                pincode: user.pincode,
                state: user.state,
                city: user.city,
                type: user.type,
                status: user.status,
                image: user.image // Return the full URL directly from the database
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const handleBase64Image = async (imageurl, userId, req) => {
    const matches = imageurl.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        console.error("Invalid base64 string format.");
        return { error: true, message: "Invalid base64 string" };
    }

    const imageType = matches[1];
    const imageBase64 = matches[2];
    const imageFileName = `${userId}_${Date.now()}.${imageType}`;
    const imagePath = path.join(uploadDir, imageFileName);

    try {
        console.log("Saving image to:", imagePath);
        fs.writeFileSync(imagePath, imageBase64, "base64");
        console.log("Image successfully written:", imageFileName);
    } catch (error) {
        console.error("Error writing the file:", error);
        return { error: true, message: "Failed to save image." };
    }

    // Return the relative path (without the base URL)
    const relativeImagePath = `/uploads/${imageFileName}`;
    console.log("Relative image path for database:", relativeImagePath);
    return { imagePath: relativeImagePath };
};


export const updateProfile = async (req, res) => {
    try {
        console.log("Request Body:", req.body);

        const userId = req.params.id;
        const {
            firstName, lastName, email, address, country,
            phone, pincode, state, city, type, status,
            jobTitle, department, employmentType, startDate, endDate,
            workLocation, workEmail, userRole, systemAccessLevel, assignedTeams,
            educationLevel, certifications, skills, languagesSpoken, employeeId,
            salaryOrHourlyRate, payrollBankDetails, tfnAbn, workVisaStatus,
            emergencyContact, linkedinProfile, notesAndComments, suburb,
            termAgreement, attendedBefore, referralCode, referredBy, faithLevel, churchId, image
        } = req.body;

        let newImagePath = null;

        // Handle base64 image if provided
        if (image && image.startsWith('data:image')) {
            const result = await handleBase64Image(image, userId, req);
            if (result.error) {
                return res.status(400).json({ message: result.message });
            }
            newImagePath = result.imagePath;
            console.log("New Image Path (relative):", newImagePath);
        } else {
            console.log("No image provided in the request body.");
        }

        // Update the user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                firstName, lastName, email, address, country,
                phone, pincode, state, city, type, status,
                jobTitle, department, employmentType, startDate, endDate,
                workLocation, workEmail, userRole, systemAccessLevel, assignedTeams,
                educationLevel, certifications, skills, languagesSpoken, employeeId,
                salaryOrHourlyRate, payrollBankDetails, tfnAbn, workVisaStatus,
                emergencyContact, linkedinProfile, notesAndComments, suburb,
                termAgreement, attendedBefore, referralCode, referredBy, faithLevel, churchId,
                image: newImagePath, // Store only the relative path
                updated_at: new Date(),
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.error("User not found during update.");
            return res.status(404).json({ message: 'User not found' });
        }

        // Full URL generation for response (using relative path stored in DB)
        const fullUrl = `${req.protocol}://${req.get("host")}`;
        const userWithFullUrl = {
            ...updatedUser._doc,
            image: updatedUser.image ? `${fullUrl}${updatedUser.image}` : null
        };

        res.status(200).json({
            message: "Profile updated successfully",
            user: userWithFullUrl,
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(400).json({ error: error.message });
    }
};



export const Profile = async (req, res) => {
    try {
        const userId = req.params.id;

        // Clone req.body to avoid mutation
        const rawData = { ...req.body };

        // Remove empty strings only
        Object.keys(rawData).forEach((key) => {
            if (rawData[key] === '') {
                delete rawData[key];
            }
        });

        // Add image path if available
        if (req.file) {
            rawData.image = `/uploads/${req.file.filename}`;
        }

        // Always update the timestamp
        rawData.updated_at = new Date();

        const updatedUser = await User.findByIdAndUpdate(userId, rawData, {
            new: true,
            runValidators: true,
        });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const fullUrl = `${req.protocol}://${req.get('host')}`;
        const userWithFullUrl = {
            ...updatedUser._doc,
            id: updatedUser._id.toString(),
            image: updatedUser.image ? `${fullUrl}${updatedUser.image}` : null,
        };
        delete userWithFullUrl._id;

        res.status(200).json({
            message: 'Profile updated successfully',
            user: userWithFullUrl,
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(400).json({ error: error.message });
    }
};

export const changePassword = async (req, res) => {
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
export const uploadProfileImage = upload.single('image'); // Middleware to handle single image upload

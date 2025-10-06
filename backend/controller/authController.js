import User from '../model/authModel.js';
import fs from 'fs';
import bcrypt from 'bcrypt';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email);

    // Log email to file for debugging purposes
    fs.appendFile('file.txt', '\n' + email, (err) => {
      if (err) throw err;
      console.log('Data written successfully.');
    });

    // Find the user by email
    const user = await User.findOne({ email });

    // If user doesn't exist or password doesn't match, send error response
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    // Construct the full URL for the image if it exists
    const fullUrl = req.protocol + '://' + req.get('host');
    const imagePath = user.image ? `${fullUrl}${user.image}` : null;

    // Log user details to file for debugging purposes
    fs.appendFile('file.txt', '\n' + user.firstName, (err) => {
      if (err) throw err;
      console.log('Data written successfully.');
    });

    // Send response with all user details
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        type: user.type,
        phone: user.phone,
        image: imagePath,
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
        language: user.language,
        referralSource: user.referralSource,
        status: user.status,
        termAgreement: user.termAgreement,
        resetCode: user.resetCode,
        resetCodeExpires: user.resetCodeExpires,
        attendedBefore: user.attendedBefore,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        faithLevel: user.faithLevel,
        churchId: user.churchId,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    // Send a generic error message
    res.status(400).json({ error: 'Invalid Credentials' });
  }
};



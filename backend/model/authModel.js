import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    phone: { type: String },
    image: { type: String },
    jobTitle: { type: String },
    department: { type: String },
    employmentType: {
        type: String,
        enum: ['Full-Time', 'Part-Time', 'Contractor', 'Permanent'],
    },
    startDate: { type: Date },
    endDate: { type: Date },
    workLocation: {
        type: String,
        enum: ['Onsite', 'Remote', 'Hybrid'],
    },
    workEmail: { type: String },
    userRole: { type: String },
    systemAccessLevel: { type: String },
    assignedTeams: [{ type: String }],
    educationLevel: { type: String },
    certifications: [{ type: String }],
    skills: [{ type: String }],
    languagesSpoken: [{ type: String }],
    employeeId: { type: String },
    salaryOrHourlyRate: { type: Number },
    payrollBankDetails: {
        type: Object,
        default: {}
    },
    tfnAbn: { type: String },
    workVisaStatus: { type: String },
    emergencyContact: {
        type: Object,
        default: {}
    },
    linkedinProfile: { type: String },
    notesAndComments: { type: String },
    address: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    suburb: { type: String },
    pincode: { type: String },
    type: { type: String },
    status: { type: String },
    termAgreement: { type: Boolean },
    resetCode: String,
    resetCodeExpires: Date,
    attendedBefore: { type: String, default: false },
    faithLevel: { type: String },
    referralCode: { type: String, unique: true },
    language: {
        type: String,
        enum: ['english', 'spanish', 'portuguese', 'indonesian', 'mandarin'],
        default: 'english'
    },

    referredBy: { type: String, default: null },
    referralSource: { type: String },
    lastActive: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    churchId: { type: mongoose.Schema.Types.ObjectId, ref: 'church' }
});

const User = mongoose.model('users', UserSchema, 'users');
export default User;
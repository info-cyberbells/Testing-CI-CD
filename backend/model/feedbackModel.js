import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: false,
    },
    feedbackType: {
        type: String,
        enum: ["General Feedback", "Complaint", "Suggestion"],
        required: true,
    },
    audioQuality: {
        type: String,
        enum: ["Good", "Average", "Poor"],
        required: false
    },
    comment: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

export default mongoose.model("Feedback", feedbackSchema);

import Feedback from "../model/feedbackModel.js";

// Add new feedback
export const addFeedback = async (req, res) => {
    try {
        const { userId, feedbackType, audioQuality, comment } = req.body;

        if (!feedbackType) {
            return res.status(400).json({ success: false, message: "feedbackType is required" });
        }
        if (audioQuality && !userId) {
            return res.status(400).json({ success: false, message: "userId is required when audioQuality is given" });
        }

        const feedback = new Feedback({
            userId,
            feedbackType,
            audioQuality,
            comment,
        });

        const savedFeedback = await feedback.save();

        res.status(201).json({
            success: true,
            message: "Feedback submitted successfully",
            data: savedFeedback,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to submit feedback",
            error: error.message,
        });
    }
};

// Get all feedback
export const getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate("userId", "firstName lastName email suburb language faithLevel")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: feedbacks.length,
            data: feedbacks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch feedback",
            error: error.message,
        });
    }
};

// Delete feedback
export const deleteFeedback = async (req, res) => {
    try {
        const id = req.query.id;

        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({ success: false, message: "Feedback not found" });
        }

        await Feedback.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Feedback deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

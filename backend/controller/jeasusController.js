import JesusClick from '../model/jeasusClicked.js';
import User from "../model/authModel.js"


export const clickJesus = async (req, res) => {
    try {
        let { userId, jesusClicked } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID and Sermon ID are required" });
        }

        if (typeof jesusClicked !== "string" || (jesusClicked !== "Yes" && jesusClicked !== "No")) {
            return res.status(400).json({ message: "jesusClicked must be 'Yes' or 'No' as a string" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isReferred = !!(user.referredBy && user.referredBy.trim() !== "");

        let saved;

        const existingClick = await JesusClick.findOne({ userId });

        if (existingClick) {
            existingClick.count += 1;
            existingClick.jesusClicked = jesusClicked;
            existingClick.isReferred = isReferred;
            saved = await existingClick.save();
        } else {
            saved = await JesusClick.create({ userId, jesusClicked, isReferred, count: 1 });
        }

        return res.status(200).json({
            status: 200,
            message: "Jesus accepted successfully",
            data: saved
        });

    } catch (err) {
        console.error('Error in Accept Jesus API:', err);
        res.status(500).json({
            message: "Server error",
            error: err.message || err
        });
    }

};



export const getAllJesusClicks = async (req, res) => {
    try {
        const clicks = await JesusClick.find({ jesusClicked: true })
            .populate('userId', 'firstName lastName email phone')
            .populate('sermonId', 'sermonName');

        res.status(200).json(clicks);
    } catch (error) {
        console.error("Error fetching Jesus Clicks:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};


export const getJesusClicksBySermon = async (req, res) => {
    try {
        const { sermonId } = req.params;

        const clicks = await JesusClick.find({ sermonId }).populate('userId', 'firstName lastName email');

        res.status(200).json(clicks);
    } catch (error) {
        console.error("Error fetching Jesus Clicks for sermon:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};


export const getJesusClicksByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const clicks = await JesusClick.find({ userId }).populate('sermonId', 'sermonName');

        res.status(200).json(clicks);
    } catch (error) {
        console.error("Error fetching Jesus Clicks for user:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};

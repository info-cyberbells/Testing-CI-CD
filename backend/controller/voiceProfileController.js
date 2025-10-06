import VoiceProfile from '../model/voiceProfileModel.js';

// Create new voice profile
export const createLanguage = async (req, res) => {
    try {
        const { voiceName, genderVoices } = req.body;

        const existing = await VoiceProfile.findOne({ voiceName });
        if (existing) {
            return res.status(400).json({ message: "Voice name already exists" });
        }

        const newProfile = new VoiceProfile({
            voiceName,
            genderVoices: {
                male: genderVoices?.male || [],
                female: genderVoices?.female || []
            }
        });

        await newProfile.save();
        res.status(201).json({ message: "Voice profile created", profile: newProfile });
    } catch (error) {
        console.error("Create VoiceProfile Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all voice profiles
export const getAllLanguages = async (req, res) => {
    try {
        const profiles = await VoiceProfile.find();
        res.status(200).json({ count: profiles.length, profiles });
    } catch (error) {
        console.error("Get VoiceProfiles Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Update a voice profile
export const updateLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const { voiceName, genderVoices } = req.body;

        const updated = await VoiceProfile.findByIdAndUpdate(
            id,
            {
                $set: {
                    voiceName,
                    genderVoices: {
                        male: genderVoices?.male || [],
                        female: genderVoices?.female || []
                    }
                }
            },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Voice profile not found" });
        }

        res.status(200).json({ message: "Voice profile updated", profile: updated });
    } catch (error) {
        console.error("Update VoiceProfile Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a voice profile
export const deleteLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await VoiceProfile.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: "Voice profile not found" });
        }

        res.status(200).json({ message: "Voice profile deleted" });
    } catch (error) {
        console.error("Delete VoiceProfile Error:", error);
        res.status(500).json({ error: error.message });
    }
};


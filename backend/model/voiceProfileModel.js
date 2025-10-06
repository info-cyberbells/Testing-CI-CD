import mongoose from 'mongoose';

const voiceProfileSchema = new mongoose.Schema({
    voiceName: {
        type: String,
        required: true,
        unique: true
    },
    genderVoices: {
        male: {
            type: [String],
            default: []
        },
        female: {
            type: [String],
            default: []
        }
    }
}, { timestamps: true });

export default mongoose.model("VoiceProfile", voiceProfileSchema);

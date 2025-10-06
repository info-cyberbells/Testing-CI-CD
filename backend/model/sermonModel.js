import mongoose from 'mongoose';

const sermonSchema = new mongoose.Schema(
  {
    churchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'church'
    },
    adminStaffUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    sermonName: {
      type: String,
    },
    startDateTime: {
      type: String,
    },
    endDateTime: {
      type: String,
    },
    status: {
      type: String
    }
  },
  { timestamps: true }
);


sermonSchema.pre('save', async function (next) {
  if (!this.sermonName) {
    const count = await mongoose.model('sermon').countDocuments();
    this.sermonName = `Sermon ${count + 1}`;
  }
  next();
});

const Sermon = mongoose.model('sermon', sermonSchema, 'sermon');

export default Sermon;

import mongoose from 'mongoose';

const jesusClickSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',

    },

    jesusClicked: {
      type: String,

    },
    count: {
      type: Number,
      default: 0,
    },

    isReferred: { type: Boolean, default: false }

  },
  { timestamps: true }
);

const JesusClick = mongoose.model('JesusClick', jesusClickSchema);

export default JesusClick;

import mongoose from 'mongoose';

const sermonSchema = new mongoose.Schema(
  {
    churchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'church' // Reference to Church collection
    },
    sermonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'sermon' 
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users' 
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

const usersListen = mongoose.model('usersListen', sermonSchema, 'usersListen');

export default usersListen;

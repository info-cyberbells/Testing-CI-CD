import mongoose from 'mongoose';

const deleteRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users', // Match the model name from User model
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

deleteRequestSchema.pre('save', async function (next) {
  next();
});

const DeleteRequest = mongoose.model('DeleteRequest', deleteRequestSchema, 'delete_requests');

export default DeleteRequest;
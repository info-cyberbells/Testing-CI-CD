import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
 
  },
  date: {
    type: Date, 
    
  },
  description: {
    type: String,
  },
  event_church_location: {
    type: String,
 
  },

  images: [String],
  churchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'church', // Reference to Church collection

  }


  
}, 
{ timestamps: true });

const Event = mongoose.model('event', eventSchema, 'event');

export default Event;

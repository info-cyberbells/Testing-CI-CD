import mongoose from 'mongoose';

const churchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,

  },
  contact_no: {
    type: String,

  },
  senior_pastor_name: {
    type: String,

  },
  senior_pastor_phone_number: {
    type: String,

  },
  city: {
    type: String,

  },
  state: {
    type: String,

  },
  country: {
    type: String,
  },
  api_key: {
    type: String,
  },
  image: { type: String },

  latitude: {
    type: String,
  },
  longitude: {
    type: String,
  },
  translator_key: {
    type: String
  },
  translator_endpoint: {
    type: String,
    default: 'https://api.cognitive.microsofttranslator.com'
  },
  translator_location: {
    type: String
  },
  speech_key: {
    type: String
  },
  speech_location: {
    type: String
  },
  languageSettings: {
    goLive: {
      male: [{
        id: { type: String },
        language: { type: String }
      }],
      female: [{
        id: { type: String },
        language: { type: String }
      }]
    },
    joinLive: {
      male: [{
        id: { type: String },
        language: { type: String }
      }],
      female: [{
        id: { type: String },
        language: { type: String }
      }]
    }
  },

  stream_limit_minutes: {
    type: Number
  },
  stream_used_minutes: {
    type: Number
  },
  stream_reset_date: {
    type: Date
  }

}, { timestamps: true });

const Church = mongoose.model('church', churchSchema, 'church');

export default Church;

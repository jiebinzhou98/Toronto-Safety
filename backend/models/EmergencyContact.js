const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: String,
  category: {
    type: String,
    enum: ['Police', 'Ambulance', 'Fire', 'Roadside', 'Other'],
    default: 'Other'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema); 
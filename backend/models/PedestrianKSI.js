const mongoose = require('mongoose');

const pedestrianKSISchema = new mongoose.Schema({
  OBJECTID: Number,
  DATE: { type: String, index: true },
  STREET1: String,
  STREET2: String,
  LATITUDE: Number,
  LONGITUDE: Number,
  VISIBILITY: String,
  LIGHT: String,
  IMPACTYPE: String,
  PEDESTRIAN: String,
  INJURY: String,
  DIVISION: { type: String, index: true },
  NEIGHBOURHOOD_158: { type: String, index: true },
  HOOD_158: Number,
  x: Number,
  y: Number,
});

// Create compound indexes for common queries
pedestrianKSISchema.index({ DATE: 1, DIVISION: 1 });
pedestrianKSISchema.index({ DATE: 1, NEIGHBOURHOOD_158: 1 });
pedestrianKSISchema.index({ LATITUDE: 1, LONGITUDE: 1 });

const PedestrianKSI = mongoose.model('PedestrianKSI', pedestrianKSISchema, 'pedestrianKSI');

module.exports = PedestrianKSI;

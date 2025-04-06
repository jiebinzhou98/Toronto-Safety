const mongoose = require("mongoose")

const fatalAccidentSchema = new mongoose.Schema({
  OBJECTID: Number,
  INDEX: Number,
  ACCNUM: Number,
  DATE: { type: String, index: true },
  TIME: Number,
  STREET1: String,
  STREET2: String,
  ROAD_CLASS: String,
  DISTRICT: { type: String, index: true },
  LATITUDE: Number,
  LONGITUDE: Number,
  TRAFFCTL: String,
  VISIBILITY: String,
  LIGHT: String,
  RDSFCOND: String,
  ACCLASS: String,
  IMPACTYPE: String,
  INVTYPE: String,
  INVAGE: String,
  INJURY: String,
  INITDIR: String,
  VEHTYPE: String,
  MANOEUVER: String,
  DRIVACT: String,
  DRIVCOND: String,
  AUTOMOBILE: String,
  HOOD_158: Number,
  NEIGHBOURHOOD_158: { type: String, index: true },
  HOOD_140: Number,
  NEIGHBOURHOOD_140: { type: String, index: true },
  DIVISION: { type: String, index: true },
  x: Number,
  y: Number,
})

// Create compound index for date range queries
fatalAccidentSchema.index({ DATE: 1, DISTRICT: 1 })
fatalAccidentSchema.index({ DATE: 1, DIVISION: 1 })
fatalAccidentSchema.index({ DATE: 1, NEIGHBOURHOOD_158: 1 })
fatalAccidentSchema.index({ DATE: 1, NEIGHBOURHOOD_140: 1 })

module.exports = mongoose.model("FatalAccident", fatalAccidentSchema, "FatalAccidents")


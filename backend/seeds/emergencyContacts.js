const mongoose = require('mongoose');
const EmergencyContact = require('../models/EmergencyContact');
require('dotenv').config();

const emergencyContacts = [
  {
    name: "Toronto Police Service",
    phone: "911",
    description: "Emergency police services for Toronto",
    location: "Toronto",
    category: "Police",
    isActive: true
  },
  {
    name: "Toronto Fire Services",
    phone: "911",
    description: "Emergency fire and rescue services",
    location: "Toronto",
    category: "Fire",
    isActive: true
  },
  {
    name: "Toronto Paramedic Services",
    phone: "911",
    description: "Emergency medical services",
    location: "Toronto",
    category: "Ambulance",
    isActive: true
  },
  {
    name: "CAA Roadside Assistance",
    phone: "1-800-222-4357",
    description: "24/7 roadside assistance and towing",
    location: "Toronto",
    category: "Roadside",
    isActive: true
  },
  {
    name: "Toronto General Hospital",
    phone: "416-340-3111",
    description: "Emergency department and trauma center",
    location: "200 Elizabeth St, Toronto",
    category: "Other",
    isActive: true
  },
  {
    name: "Sunnybrook Health Sciences Centre",
    phone: "416-480-6100",
    description: "Emergency department and trauma center",
    location: "2075 Bayview Ave, Toronto",
    category: "Other",
    isActive: true
  },
  {
    name: "St. Michael's Hospital",
    phone: "416-360-4000",
    description: "Emergency department and trauma center",
    location: "30 Bond St, Toronto",
    category: "Other",
    isActive: true
  }
];

const seedEmergencyContacts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear existing contacts
    await EmergencyContact.deleteMany({});

    // Insert new contacts
    await EmergencyContact.insertMany(emergencyContacts);

    console.log('Emergency contacts seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding emergency contacts:', error);
    process.exit(1);
  }
};

seedEmergencyContacts(); 
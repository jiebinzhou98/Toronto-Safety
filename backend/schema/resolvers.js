const FatalAccident = require("../models/FatalAccident");
const ShootingIncident = require("../models/ShootingIncidents");
const Homicide = require("../models/Homicide");

const resolvers = {
  Query: {
    // Fetch all fatal accidents
    fatalAccidents: async () => {
      try {
        const accidents = await FatalAccident.find({});
        return accidents;
      } catch (error) {
        console.error("Error fetching fatal accidents:", error);
        throw new Error(`Error fetching fatal accidents: ${error.message}`);
      }
    },

    // Fetch fatal accidents by district
    fatalAccidentsByDistrict: async (_, { district }) => {
      try {
        const accidents = await FatalAccident.find({ DISTRICT: district });
        console.log(`Fetched ${accidents.length} fatal accidents in district: ${district}`);
        return accidents;
      } catch (error) {
        console.error(`Error fetching fatal accidents by district ${district}:`, error);
        throw new Error(`Error fetching fatal accidents by district: ${error.message}`);
      }
    },

    // Query for all shooting incidents
    shootingIncidents: async () => {
      try {
        const incidents = await ShootingIncident.find({});
        // Handle data type mismatch (e.g., convert non-numeric fields to String)
        return incidents.map(incident => ({
          ...incident.toObject(),
          DEATH: isNaN(incident.DEATH) ? String(incident.DEATH) : incident.DEATH,  // Convert non-numeric DEATH to String
          INJURIES: isNaN(incident.INJURIES) ? String(incident.INJURIES) : incident.INJURIES, // Convert non-numeric INJURIES to String
        }));
      } catch (error) {
        console.error("Error fetching shooting incidents:", error);
        throw new Error(`Error fetching shooting incidents: ${error.message}`);
      }
    },
    // Query for shooting incidents by division
    shootingIncidentsByDivision: async (_, { division }) => {
      try {
        const incidents = await ShootingIncident.find({ DIVISION: division });
        return incidents;
      } catch (error) {
        console.error(`Error fetching shooting incidents in division ${division}:`, error);
        throw new Error(`Error fetching shooting incidents by division: ${error.message}`);
      }
    },

    homicides: async () => {
      try {
        const homicides = await Homicide.find({});
        return homicides;
      } catch (error) {
        console.error("Error fetching homicides:", error);
        throw new Error("Error fetching homicides");
      }
    },
    // Query for homicides by division
    homicidesByDivision: async (_, { division }) => {
      try {
        const homicides = await Homicide.find({ DIVISION: division });
        return homicides;
      } catch (error) {
        console.error(`Error fetching homicides in division ${division}:`, error);
        throw new Error(`Error fetching homicides by division: ${error.message}`);
      }
    },
  },
};

module.exports = { resolvers };

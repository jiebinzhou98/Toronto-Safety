const FatalAccident = require("../models/FatalAccident");
const ShootingIncident = require("../models/ShootingIncidents");
const Homicide = require("../models/Homicide");
const BreakAndEnterIncident = require("../models/BreakAndEnter");
const PedestrianKSI = require("../models/PedestrianKSI");

const resolvers = {
  Query: {
    // Fetch all fatal accidents
    fatalAccidents: async () => {
      try {
        return await FatalAccident.find({});
      } catch (error) {
        console.error("Error fetching fatal accidents:", error);
        throw new Error("Error fetching fatal accidents");
      }
    },

    // Fetch fatal accidents by district
    fatalAccidentsByDistrict: async (_, { district }) => {
      try {
        return await FatalAccident.find({ DISTRICT: district });
      } catch (error) {
        console.error(`Error fetching fatal accidents by district ${district}:`, error);
        throw new Error("Error fetching fatal accidents by district");
      }
    },

    // Query for all shooting incidents
    shootingIncidents: async () => {
      try {
        const incidents = await ShootingIncident.find({});
        return incidents.map(incident => ({
          ...incident.toObject(),
          DEATH: isNaN(incident.DEATH) ? String(incident.DEATH) : incident.DEATH, // Ensure DEATH is always a string
          INJURIES: isNaN(incident.INJURIES) ? String(incident.INJURIES) : incident.INJURIES, // Ensure INJURIES is always a string
        }));
      } catch (error) {
        console.error("Error fetching shooting incidents:", error);
        throw new Error("Error fetching shooting incidents");
      }
    },

    // Query for shooting incidents by division
    shootingIncidentsByDivision: async (_, { division }) => {
      try {
        return await ShootingIncident.find({ DIVISION: division });
      } catch (error) {
        console.error(`Error fetching shooting incidents by division ${division}:`, error);
        throw new Error("Error fetching shooting incidents by division");
      }
    },

    // Query for all homicides
    homicides: async () => {
      try {
        return await Homicide.find({});
      } catch (error) {
        console.error("Error fetching homicides:", error);
        throw new Error("Error fetching homicides");
      }
    },

    // Query for homicides by division
    homicidesByDivision: async (_, { division }) => {
      try {
        return await Homicide.find({ DIVISION: division });
      } catch (error) {
        console.error(`Error fetching homicides by division ${division}:`, error);
        throw new Error("Error fetching homicides by division");
      }
    },

    // Query for all break and enter incidents
    breakAndEnterIncidents: async () => {
      try {
        return await BreakAndEnterIncident.find({});
      } catch (error) {
        console.error("Error fetching break and enter incidents:", error);
        throw new Error("Error fetching break and enter incidents");
      }
    },

    // Query for break and enter incidents by neighborhood
    breakAndEnterIncidentsByNeighborhood: async (_, { neighborhood }) => {
      try {
        return await BreakAndEnterIncident.find({ NEIGHBOURHOOD_158: neighborhood });
      } catch (error) {
        console.error(`Error fetching break and enter incidents by neighborhood ${neighborhood}:`, error);
        throw new Error("Error fetching break and enter incidents by neighborhood");
      }
    },

    // Query for all pedestrian KSI incidents
    pedestrianKSI: async () => {
      try {
        return await PedestrianKSI.find({});
      } catch (error) {
        console.error("Error fetching pedestrian KSI incidents:", error);
        throw new Error("Error fetching pedestrian KSI incidents");
      }
    },

    // Query for pedestrian KSI incidents by neighborhood
    pedestrianKSIByNeighborhood: async (_, { neighborhood }) => {
      try {
        return await PedestrianKSI.find({ NEIGHBOURHOOD_158: neighborhood });
      } catch (error) {
        console.error(`Error fetching pedestrian KSI incidents by neighborhood ${neighborhood}:`, error);
        throw new Error("Error fetching pedestrian KSI incidents by neighborhood");
      }
    },
  },
};

module.exports = { resolvers };

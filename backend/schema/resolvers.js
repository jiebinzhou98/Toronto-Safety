const FatalAccident = require("../models/FatalAccident")

const resolvers = {
  Query: {
    fatalAccidents: async () => {
      try {
        const accidents = await FatalAccident.find({})
        return accidents
      } catch (error) {
        console.error("Error fetching fatal accidents:", error)
        throw new Error(`Error fetching fatal accidents: ${error.message}`)
      }
    },
    fatalAccidentsByDistrict: async (_, { district }) => {
      try {
        const accidents = await FatalAccident.find({ DISTRICT: district })
        console.log(`Fetched ${accidents.length} fatal accidents in district: ${district}`)
        return accidents
      } catch (error) {
        console.error(`Error fetching fatal accidents by district ${district}:`, error)
        throw new Error(`Error fetching fatal accidents by district: ${error.message}`)
      }
    },
  },
}

module.exports = { resolvers }


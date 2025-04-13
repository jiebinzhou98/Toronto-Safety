const FatalAccident = require("../models/FatalAccident")
const ShootingIncident = require("../models/ShootingIncidents")
const Homicide = require("../models/Homicide")
const BreakAndEnterIncident = require("../models/BreakAndEnter")
const PedestrianKSI = require("../models/PedestrianKSI")
const Discussion = require("../models/Discussion")
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

// Helper function to convert YYYY-MM-DD to MongoDB date format (M/D/YYYY)
const formatDateForMongoDB = (dateStr) => {
  if (!dateStr) return null

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      console.error(`Invalid date: ${dateStr}`)
      return null
    }

    const month = date.getMonth() + 1 // getMonth() is 0-indexed
    const day = date.getDate()
    const year = date.getFullYear()

    return `${month}/${day}/${year}`
  } catch (e) {
    console.error(`Error formatting date: ${dateStr}`, e)
    return null
  }
}

// Helper function to parse MongoDB date string to Date object
const parseMongoDB_DateString = (dateStr) => {
  if (!dateStr) return null

  try {
    // If it's already a Date object, return it
    if (dateStr instanceof Date) {
      return dateStr;
    }
    
    // Convert to string if it's not already
    const dateString = String(dateStr).trim();
    
    // Log the date we're trying to parse
    console.log(`Parsing date: "${dateString}"`);
    
    // Handle different date formats that might be in the database
    // Extract just the date part (before any time or AM/PM)
    const datePart = dateString.split(" ")[0].trim();
    
    // Try multiple date formats
    
    // Check if it's a numeric timestamp (milliseconds since epoch)
    if (!isNaN(dateString) && dateString.length > 8) {
      const timestamp = parseInt(dateString);
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        console.log(`Parsed as timestamp: ${date.toISOString()}`);
        return date;
      }
    }

    // Check if the date is in MM/DD/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(datePart)) {
      const [month, day, year] = datePart.split("/").map((num) => Number.parseInt(num, 10));
      // Create a new Date object (months are 0-indexed in JavaScript)
      const date = new Date(year, month - 1, day);
      console.log(`Parsed as MM/DD/YYYY: ${date.toISOString()}`);
      return date;
    }
    
    // Check if the date is in YYYY-MM-DD format
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(datePart)) {
      const [year, month, day] = datePart.split("-").map((num) => Number.parseInt(num, 10));
      const date = new Date(year, month - 1, day);
      console.log(`Parsed as YYYY-MM-DD: ${date.toISOString()}`);
      return date;
    }
    
    // Check if the date is in YYYY/MM/DD format
    else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(datePart)) {
      const [year, month, day] = datePart.split("/").map((num) => Number.parseInt(num, 10));
      const date = new Date(year, month - 1, day);
      console.log(`Parsed as YYYY/MM/DD: ${date.toISOString()}`);
      return date;
    }
    
    // Check if the date is in DD-MM-YYYY format
    else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(datePart)) {
      const [day, month, year] = datePart.split("-").map((num) => Number.parseInt(num, 10));
      const date = new Date(year, month - 1, day);
      console.log(`Parsed as DD-MM-YYYY: ${date.toISOString()}`);
      return date;
    }
    
    // Check if it's a date in format "Month DD, YYYY"
    else if (/[a-zA-Z]+\s+\d{1,2},\s+\d{4}/.test(dateString)) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        console.log(`Parsed as Month DD, YYYY: ${date.toISOString()}`);
        return date;
      }
    }

    // If we can't parse it with our custom logic, try the native Date parser
    const fallbackDate = new Date(dateString);
    if (!isNaN(fallbackDate.getTime())) {
      console.log(`Parsed with native Date parser: ${fallbackDate.toISOString()}`);
      return fallbackDate;
    }

    console.log(`Failed to parse date: "${dateString}"`);
    return null;
  } catch (e) {
    console.error(`Error parsing date string: "${dateStr}"`, e);
    return null;
  }
}

// Helper function to check if a date is within a range
const isDateInRange = (dateStr, startDate, endDate) => {
  if (!dateStr) return false

  try {
    const date = parseMongoDB_DateString(dateStr)
    if (!date) return false

    let isInRange = true

    if (startDate) {
      const start = new Date(startDate)
      // Set start to beginning of day
      start.setHours(0, 0, 0, 0)
      isInRange = isInRange && date >= start
    }

    if (endDate) {
      const end = new Date(endDate)
      // Set end to end of day
      end.setHours(23, 59, 59, 999)
      isInRange = isInRange && date <= end
    }

    return isInRange
  } catch (e) {
    return false
  }
}

// Helper function to find the appropriate date field for a given model
const getDateFieldForModel = (Model) => {
  const modelName = Model.modelName;
  
  // Map model names to their date fields
  const dateFieldMap = {
    'FatalAccident': 'DATE',
    'ShootingIncident': 'OCC_DATE',
    'Homicide': 'OCC_DATE',
    'BreakAndEnterIncident': 'OCC_DATE',
    'PedestrianKSI': 'DATE'
  };
  
  // Return the mapped field or a default
  const dateField = dateFieldMap[modelName];
  console.log(`Using date field "${dateField}" for model "${modelName}"`);
  return dateField || 'DATE'; // Default to DATE if not found
};

// Universal date filter function that can be applied to any incident collection
const applyDateFilter = async (Model, query = {}, startDate, endDate, limit = 2000, offset = 0) => {
  try {
    // Determine the date field for this model
    const dateField = getDateFieldForModel(Model);
    
    console.log(`Applying date filter to ${Model.modelName} using field "${dateField}"`);
    console.log(`Query criteria: ${JSON.stringify(query)}`);
    console.log(`Date range: ${startDate || 'any'} to ${endDate || 'any'}`);
    
    // First fetch all incidents matching the base query without limiting the results
    const incidents = await Model.find(query)
      .limit(Math.min(limit * 3, 6000)) // Increased to 6000 to handle larger result sets
      .skip(offset)
      .maxTimeMS(60000) // Increased timeout to 60 seconds
      .lean()
      .exec();
    
    console.log(`Retrieved ${incidents.length} records from ${Model.modelName}`);
    
    // Sample the date fields from the first few records to understand format
    if (incidents.length > 0) {
      const sampleDates = incidents.slice(0, 3).map(inc => inc[dateField]);
      console.log(`Sample date values from ${Model.modelName}: ${JSON.stringify(sampleDates)}`);
    }
    
    // If no date filtering needed, return the results with pagination
    if (!startDate && !endDate) {
      console.log(`No date filtering applied, returning ${Math.min(incidents.length, limit)} records`);
      return incidents.slice(0, limit);
    }
    
    // Create Date objects from startDate and endDate for comparison
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    
    if (startDateObj) startDateObj.setHours(0, 0, 0, 0);
    if (endDateObj) endDateObj.setHours(23, 59, 59, 999);
    
    console.log(`Start date for comparison: ${startDateObj ? startDateObj.toISOString() : 'none'}`);
    console.log(`End date for comparison: ${endDateObj ? endDateObj.toISOString() : 'none'}`);
    
    // Filter the results by date
    const filteredResults = incidents.filter(incident => {
      const dateValue = incident[dateField];
      
      // Skip records with no date
      if (!dateValue) {
        return false;
      }
      
      // Try parsing the date
      try {
        const parsedDate = parseMongoDB_DateString(dateValue);
        
        // Skip if date can't be parsed
        if (!parsedDate) {
          return false;
        }
        
        // Check against start date
        if (startDateObj && parsedDate < startDateObj) {
          return false;
        }
        
        // Check against end date
        if (endDateObj && parsedDate > endDateObj) {
          return false;
        }
        
        return true;
      } catch (err) {
        console.error(`Error parsing date ${dateValue}:`, err);
        return false;
      }
    });
    
    console.log(`After date filtering, found ${filteredResults.length} records in range`);
    
    // Apply pagination to filtered results - return all results up to the limit
    const paginatedResults = filteredResults.slice(0, limit);
    console.log(`Returning ${paginatedResults.length} records after pagination`);
    
    return paginatedResults;
  } catch (error) {
    console.error(`Error applying date filter to ${Model.modelName}:`, error);
    throw error;
  }
};

const resolvers = {
  Query: {
    // Fatal Accidents
    fatalAccidents: async (_, { startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(FatalAccident, {}, startDate, endDate, limit, offset);
      } catch (error) {
        console.error("Error fetching fatal accidents:", error);
        throw new Error(`Error fetching fatal accidents: ${error.message}`);
      }
    },
    fatalAccidentsByDistrict: async (_, { district, startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(FatalAccident, { DISTRICT: district }, startDate, endDate, limit, offset);
      } catch (error) {
        console.error(`Error fetching fatal accidents by district ${district}:`, error);
        throw new Error(`Error fetching fatal accidents by district: ${error.message}`);
      }
    },

    // Shooting Incidents
    shootingIncidents: async (_, { startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(ShootingIncident, {}, startDate, endDate, limit, offset);
      } catch (error) {
        console.error("Error fetching shooting incidents:", error);
        throw new Error(`Error fetching shooting incidents: ${error.message}`);
      }
    },
    shootingIncidentsByDivision: async (_, { division, startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(ShootingIncident, { DIVISION: division }, startDate, endDate, limit, offset);
      } catch (error) {
        console.error(`Error fetching shooting incidents by division ${division}:`, error);
        throw new Error(`Error fetching shooting incidents by division: ${error.message}`);
      }
    },

    // Homicides
    homicides: async (_, { startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(Homicide, {}, startDate, endDate, limit, offset);
      } catch (error) {
        console.error("Error fetching homicides:", error);
        throw new Error(`Error fetching homicides: ${error.message}`);
      }
    },
    homicidesByDivision: async (_, { division, startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(Homicide, { DIVISION: division }, startDate, endDate, limit, offset);
      } catch (error) {
        console.error(`Error fetching homicides by division ${division}:`, error);
        throw new Error(`Error fetching homicides by division: ${error.message}`);
      }
    },

    // Break and Enter Incidents
    breakAndEnterIncidents: async (_, { startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(BreakAndEnterIncident, {}, startDate, endDate, limit, offset);
      } catch (error) {
        console.error("Error fetching break and enter incidents:", error);
        throw new Error(`Error fetching break and enter incidents: ${error.message}`);
      }
    },
    breakAndEnterIncidentsByDivision: async (_, { division, startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(BreakAndEnterIncident, { DIVISION: division }, startDate, endDate, limit, offset);
      } catch (error) {
        console.error(`Error fetching break and enter incidents by division ${division}:`, error);
        throw new Error(`Error fetching break and enter incidents by division: ${error.message}`);
      }
    },
    breakAndEnterIncidentsByNeighborhood: async (_, { neighborhood, startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(BreakAndEnterIncident, { NEIGHBOURHOOD_158: neighborhood }, startDate, endDate, limit, offset);
      } catch (error) {
        console.error(`Error fetching break and enter incidents by neighborhood ${neighborhood}:`, error);
        throw new Error(`Error fetching break and enter incidents by neighborhood: ${error.message}`);
      }
    },

    // Pedestrian KSI
    pedestrianKSI: async (_, { startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(PedestrianKSI, {}, startDate, endDate, limit, offset);
      } catch (error) {
        console.error("Error fetching pedestrian KSI incidents:", error);
        throw new Error(`Error fetching pedestrian KSI incidents: ${error.message}`);
      }
    },
    pedestrianKSIByDivision: async (_, { division, startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(PedestrianKSI, { DIVISION: division }, startDate, endDate, limit, offset);
      } catch (error) {
        console.error(`Error fetching pedestrian KSI incidents by division ${division}:`, error);
        throw new Error(`Error fetching pedestrian KSI incidents by division: ${error.message}`);
      }
    },
    pedestrianKSIByNeighborhood: async (_, { neighborhood, startDate, endDate, limit = 2000, offset = 0 }) => {
      try {
        return await applyDateFilter(PedestrianKSI, { NEIGHBOURHOOD_158: neighborhood }, startDate, endDate, limit, offset);
      } catch (error) {
        console.error(`Error fetching pedestrian KSI incidents by neighborhood ${neighborhood}:`, error);
        throw new Error(`Error fetching pedestrian KSI incidents by neighborhood: ${error.message}`);
      }
    },

    // User
    me: async (_, __, { user }) => {
      if (!user) {
        throw new Error("Not authenticated")
      }
      return await User.findById(user.id)
    },

    getDiscussions: async () => {
      try {
        return await Discussion.find().sort({ createdAt: -1 });
      } catch (error) {
        console.error("Error fetching discussions:", error);
        throw new Error("Error fetching discussions");
      }
    },
  },

  Mutation: {
    // User Authentication
    register: async (_, { username, email, password }) => {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
          throw new Error("User already exists with that email")
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create new user
        const user = new User({
          username,
          email,
          password: hashedPassword,
          role: "user", // Default role
          createdAt: new Date().toISOString(),
        })

        // Save user to database
        const savedUser = await user.save()

        // Generate JWT token
        const token = jwt.sign(
          { id: savedUser._id, email: savedUser.email, role: savedUser.role },
          process.env.JWT_SECRET || "your-secret-key",
          { expiresIn: "1d" },
        )

        return {
          token,
          user: savedUser,
        }
      } catch (error) {
        console.error("Error registering user:", error)
        throw new Error(`Error registering user: ${error.message}`)
      }
    },
    login: async (_, { email, password }) => {
      try {
        // Find user by email
        const user = await User.findOne({ email })
        if (!user) {
          throw new Error("No user found with that email")
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
          throw new Error("Invalid password")
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET || "your-secret-key",
          { expiresIn: "1d" },
        )

        return {
          token,
          user,
        }
      } catch (error) {
        console.error("Error logging in:", error)
        throw new Error(`Error logging in: ${error.message}`)
      }
    },

    addDiscussion: async (_, { title, message, author }) => {
      try {
        const newDiscussion = new Discussion({
          title,
          message,
          author,
          createdAt: new Date().toISOString(),
        });
        return await newDiscussion.save();
      } catch (error) {
        console.error("Error creating discussion:", error);
        throw new Error("Error creating discussion");
      }
    },
    deleteDiscussion: async (_, { id }) => {
      return await Discussion.findByIdAndDelete(id);
    }

  },
}

module.exports = { resolvers }
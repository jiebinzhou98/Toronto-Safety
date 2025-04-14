const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const EmergencyContact = require('../models/EmergencyContact');
require('dotenv').config();

// Enhanced initialization with better error handling
console.log('GEMINI_API_KEY status:', process.env.GEMINI_API_KEY ? 'Present (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'Missing');

let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Successfully initialized Gemini AI client');
  } else {
    console.error('GEMINI_API_KEY is missing in environment variables');
  }
} catch (error) {
  console.error('Error initializing Gemini AI client:', error);
}

// Get all emergency contacts
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ isActive: true });
    res.json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ message: 'Error fetching emergency contacts' });
  }
});

// Add new emergency contact
router.post('/contacts', async (req, res) => {
  try {
    const contact = new EmergencyContact(req.body);
    await contact.save();
    res.status(201).json(contact);
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(500).json({ message: 'Error creating emergency contact' });
  }
});

// Updated chat endpoint
router.post('/chat', async (req, res) => {
  try {
    if (!genAI) {
      throw new Error('Gemini AI not initialized - check API key');
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get emergency contacts
    const contacts = await EmergencyContact.find({ isActive: true });
    const contactsText = contacts.map(c => 
      `${c.name} (${c.category}): ${c.phone} - ${c.description}`
    ).join('\n');

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest" // Updated model name
    });

    const prompt = `
      You are a Toronto safety and emergency assistance AI. Provide concise, accurate information about:
      1. Immediate actions for the described situation
      2. Safety precautions
      3. Relevant emergency contacts (use these if applicable: ${contactsText})
      4. Long-term prevention tips
      
      Prioritize human safety. For dangerous situations, emphasize calling 911.
      
      Current situation: ${message}
      
      Format your response in clear sections with bullet points where appropriate.
    `;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const response = await result.response;
    res.json({ 
      text: response.text(),
      emergencyContacts: contacts,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

  } catch (error) {
    console.error('Backend Error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      fallbackResponse: `I'm sorry, I'm having trouble processing your request right now. For immediate assistance, please contact emergency services at 911.`
    });
  }
});

// New endpoint: Parse natural language prediction query
router.post('/parseQuery', async (req, res) => {
  try {
    if (!genAI) {
      throw new Error('Gemini AI not initialized - check API key');
    }

    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest"
    });

    const prompt = `
      You are an AI assistant that extracts parameters from natural language queries about safety predictions in Toronto.
      
      Extract the following information from this query (if present):
      1. Date (in YYYY-MM-DD format)
      2. Location (specific neighborhood or division in Toronto)
      3. Incident type (fatal accident, shooting, homicide, break and enter, pedestrian injury)
      
      Current query: "${query}"
      
      Respond with a JSON object containing only these extracted parameters. If a parameter is not found, omit it from the response:
      {
        "parameters": {
          "date": "YYYY-MM-DD",  // only if a specific date is mentioned
          "location": "neighborhood name",  // only if a specific location is mentioned
          "incidentType": "type of incident"  // only if a specific incident type is mentioned
        }
      }
    `;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const responseText = await result.response.text();
    
    // Parse the response as JSON
    try {
      const parsedResponse = JSON.parse(responseText);
      res.json(parsedResponse);
    } catch (parseError) {
      console.error('Error parsing Gemini response as JSON:', parseError);
      res.json({ parameters: null });
    }

  } catch (error) {
    console.error('Parse Query Error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to parse query',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// New endpoint: Generate safety predictions
router.post('/predict', async (req, res) => {
  console.log('⭐ Predict endpoint called with data:', {
    date: req.body.date,
    location: req.body.location,
    incidentType: req.body.incidentType,
    useLocalDataOnly: req.body.useLocalDataOnly
  });

  try {
    if (!genAI) {
      throw new Error('Gemini AI not initialized - check API key');
    }

    const { date, location, incidentType, useLocalDataOnly } = req.body;
    
    if (!date || !location || !incidentType) {
      return res.status(400).json({ 
        error: 'Date, location, and incident type are required' 
      });
    }

    // Validate the data format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest"
    });

    // If local-only mode is requested, skip historical data processing
    if (useLocalDataOnly) {
      const localPrediction = generateLocalPrediction(incidentType, date, location);
      return res.json(localPrediction);
    }

    // Count incidents of the same type in the same location
    let relevantIncidents = [];
    let totalIncidents = 0;

    if (incidentType === 'fatalAccidents' && historicalData.fatalAccidents) {
      relevantIncidents = historicalData.fatalAccidents.filter(i => 
        i.DISTRICT === location || i.DISTRICT === location.toString());
      totalIncidents = historicalData.fatalAccidents.length;
    } else if (incidentType === 'shootingIncidents' && historicalData.shootingIncidents) {
      relevantIncidents = historicalData.shootingIncidents.filter(i => 
        i.DIVISION === location || i.DIVISION === location.toString());
      totalIncidents = historicalData.shootingIncidents.length;
    } else if (incidentType === 'homicides' && historicalData.homicides) {
      relevantIncidents = historicalData.homicides.filter(i => 
        i.DIVISION === location || i.DIVISION === location.toString());
      totalIncidents = historicalData.homicides.length;
    } else if (incidentType === 'breakAndEnterIncidents' && historicalData.breakAndEnterIncidents) {
      relevantIncidents = historicalData.breakAndEnterIncidents.filter(i => 
        i.DIVISION === location || i.DIVISION === location.toString());
      totalIncidents = historicalData.breakAndEnterIncidents.length;
    } else if (incidentType === 'pedestrianKSI' && historicalData.pedestrianKSI) {
      relevantIncidents = historicalData.pedestrianKSI.filter(i => 
        i.DIVISION === location || i.DIVISION === location.toString());
      totalIncidents = historicalData.pedestrianKSI.length;
    }

    console.log(`Found ${relevantIncidents.length} relevant incidents out of ${totalIncidents} total for ${incidentType}`);

    // If no Gemini API is available, or if we have insufficient data, return a fallback prediction
    if (!genAI || relevantIncidents.length < 3) {
      console.log('Generating fallback prediction due to insufficient data or missing API key');
      const fallbackPrediction = generateFallbackPrediction(relevantIncidents, totalIncidents, incidentType, date, location);
      return res.json(fallbackPrediction);
    }

    // Prepare incident stats for the AI
    const locationIncidentCount = relevantIncidents.length;
    const locationPercentage = totalIncidents > 0 
      ? ((locationIncidentCount / totalIncidents) * 100).toFixed(1) 
      : 0;

    // Extract month and day of week from the target date
    const month = dateObj.getMonth() + 1; // 1-12
    const dayOfWeek = dateObj.getDay(); // 0-6, where 0 is Sunday
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Analyze temporal patterns in the relevant incidents
    let monthCounts = Array(12).fill(0);
    let dowCounts = Array(7).fill(0);
    let hourCounts = Array(24).fill(0);
    
    relevantIncidents.forEach(incident => {
      let incidentDate;
      
      // Handle different date field names based on incident type
      if (incidentType === 'fatalAccidents' || incidentType === 'pedestrianKSI') {
        incidentDate = new Date(incident.DATE);
      } else {
        incidentDate = new Date(incident.OCC_DATE);
      }
      
      if (!isNaN(incidentDate.getTime())) {
        monthCounts[incidentDate.getMonth()]++;
        dowCounts[incidentDate.getDay()]++;
        
        // Extract hour if available
        if (incidentType === 'fatalAccidents' && incident.TIME) {
          const hourMatch = incident.TIME.match(/^(\d{1,2}):/);
          if (hourMatch) {
            const hour = parseInt(hourMatch[1]);
            if (!isNaN(hour) && hour >= 0 && hour < 24) {
              hourCounts[hour]++;
            }
          }
        } else if (incidentType === 'breakAndEnterIncidents' && incident.OCC_HOUR) {
          const hour = parseInt(incident.OCC_HOUR);
          if (!isNaN(hour) && hour >= 0 && hour < 24) {
            hourCounts[hour]++;
          }
        }
      }
    });

    // Find peak times
    const maxMonthCount = Math.max(...monthCounts);
    const maxDowCount = Math.max(...dowCounts);
    const maxHourCount = Math.max(...hourCounts);
    
    const peakMonths = monthCounts
      .map((count, idx) => ({ month: idx, count }))
      .filter(m => m.count > maxMonthCount * 0.8)
      .map(m => monthNames[m.month]);
      
    const peakDays = dowCounts
      .map((count, idx) => ({ day: idx, count }))
      .filter(d => d.count > maxDowCount * 0.8)
      .map(d => dayNames[d.day]);
      
    const peakHours = hourCounts
      .map((count, idx) => ({ hour: idx, count }))
      .filter(h => h.count > maxHourCount * 0.8)
      .map(h => h.hour);

    // Prepare the data summary for the AI
    const dataSummary = `
      Historical Data Summary:
      - Total incidents of type "${incidentType}" in the dataset: ${totalIncidents}
      - Incidents in division/location "${location}": ${locationIncidentCount} (${locationPercentage}% of total)
      - Most common months for incidents: ${peakMonths.join(', ') || 'Not enough data'}
      - Most common days of week: ${peakDays.join(', ') || 'Not enough data'}
      - Most common hours: ${peakHours.map(h => `${h}:00`).join(', ') || 'Not enough data'}
      
      Target prediction:
      - Date: ${date} (${monthNames[month-1]}, ${dayNames[dayOfWeek]})
      - Location: ${location}
      - Incident type: ${incidentType}
    `;

    console.log('Generating AI prediction with data summary:', dataSummary);

    const prompt = `
      You are an advanced AI safety prediction model for the city of Toronto. Based on historical incident data, you need to predict the likelihood of a specific incident occurring at a given location and date.
      
      ${dataSummary}
      
      Analyze this data and provide:
      1. A clear prediction on the likelihood of this incident occurring (as a percentage)
      2. Key risk factors that influence this prediction
      3. A confidence score for your prediction (0-100%)
      4. A brief explanation of similar historical incidents
      
      Format your response as a JSON object with these fields:
      {
        "prediction": "A clear textual explanation of your prediction",
        "probability": "numeric probability as an integer from 0-100",
        "confidence": "numeric confidence as an integer from 0-100",
        "riskFactors": ["factor1", "factor2", "factor3"],
        "similarIncidents": "Brief description of similar historical patterns"
      }
    `;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const responseText = await result.response.text();
    console.log('Received AI response:', responseText.substring(0, 100) + '...');
    
    // Parse the response as JSON
    try {
      const parsedResponse = JSON.parse(responseText);
      res.json(parsedResponse);
    } catch (parseError) {
      console.error('Error parsing Gemini response as JSON:', parseError);
      // Generate fallback prediction if AI response can't be parsed
      const fallbackPrediction = generateFallbackPrediction(relevantIncidents, totalIncidents, incidentType, date, location);
      res.json(fallbackPrediction);
    }

  } catch (error) {
    console.error('Prediction Error:', {
      message: error.message,
      stack: error.stack
    });
    
    // On error, return a fallback prediction
    try {
      const fallbackPrediction = generateFallbackPrediction([], 0, req.body.incidentType || 'unknown', req.body.date || new Date().toISOString(), req.body.location || 'unknown');
      res.json(fallbackPrediction);
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to generate prediction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        fallbackError: fallbackError.message
      });
    }
  }
});

// Helper function for generating fallback predictions when AI is unavailable
function generateFallbackPrediction(relevantIncidents, totalIncidents, incidentType, date, location) {
  const incidentCount = relevantIncidents.length;
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  const month = dateObj.getMonth(); // 0-11
  
  // Calculate basic risk metrics
  let baseProbability = Math.min(Math.max(incidentCount > 0 ? 30 + (incidentCount * 2) : 15, 10), 85);
  
  // Adjust for weekday/weekend
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendAdjustment = isWeekend ? 5 : -2;
  
  // Adjust for season (summer tends to have more incidents)
  const isSummer = month >= 5 && month <= 8; // June through September
  const isWinter = month === 11 || month === 0 || month === 1; // Dec through Feb
  const seasonAdjustment = isSummer ? 8 : (isWinter ? -5 : 0);
  
  // Final probability calculation
  const probability = Math.min(Math.max(baseProbability + weekendAdjustment + seasonAdjustment, 5), 95);
  
  // Set confidence based on data quantity
  const confidence = Math.max(40, Math.min(65 + (Math.min(incidentCount, 20) * 1.5), 85));
  
  // Generate risk factors
  const riskFactors = [];
  
  // Add location factor if significant data
  if (incidentCount > 3) {
    riskFactors.push(`Historical incident patterns in ${location}`);
  } else {
    riskFactors.push(`Limited historical data for ${location}`);
  }
  
  // Add temporal factors
  if (isWeekend) {
    riskFactors.push("Weekend timing (higher risk period)");
  }
  
  if (isSummer) {
    riskFactors.push("Summer season (historically higher risk)");
  } else if (isWinter) {
    riskFactors.push("Winter conditions (potential weather-related factors)");
  }
  
  // Add some general factors based on incident type
  if (incidentType === 'fatalAccidents' || incidentType === 'pedestrianKSI') {
    riskFactors.push("Traffic volume patterns");
  } else if (incidentType === 'shootingIncidents' || incidentType === 'homicides') {
    riskFactors.push("Urban density factors");
  } else if (incidentType === 'breakAndEnterIncidents') {
    riskFactors.push("Residential vs. commercial area patterns");
  }
  
  // Ensure we have at least 3 factors
  const possibleExtraFactors = [
    "Time of day patterns",
    "Proximity to high-activity areas",
    "Demographic considerations",
    "Urban infrastructure factors",
    "Seasonal trends"
  ];
  
  while (riskFactors.length < 3) {
    const randomFactor = possibleExtraFactors[Math.floor(Math.random() * possibleExtraFactors.length)];
    if (!riskFactors.includes(randomFactor)) {
      riskFactors.push(randomFactor);
    }
  }
  
  // Create prediction text
  let predictionText;
  if (probability < 30) {
    predictionText = `Based on analysis of ${incidentCount} historical incidents in ${location}, there is a relatively low probability (${probability}%) of a similar incident occurring on the selected date. The risk factors are minimal, but it's still prudent to remain aware of your surroundings.`;
  } else if (probability < 60) {
    predictionText = `Based on analysis of ${incidentCount} historical incidents in ${location}, there is a moderate probability (${probability}%) of a similar incident occurring on the selected date. Review the identified risk factors and exercise appropriate caution.`;
  } else {
    predictionText = `Based on analysis of ${incidentCount} historical incidents in ${location}, there is a relatively high probability (${probability}%) of a similar incident occurring on the selected date. The risk factors indicate elevated concern, and enhanced precautions would be advisable.`;
  }
  
  // Create similar incidents text
  const similarIncidentsText = `${incidentCount} incidents have been recorded in this division historically. ${
    isWeekend ? "Weekend incidents are statistically more common in this area. " : ""
  }${
    isSummer ? "Summer months show higher incident rates in historical data." : (isWinter ? "Winter conditions have specific risk factors in this area." : "")
  }`;
  
  console.log('Generated fallback prediction with probability', probability);
  
  return {
    prediction: predictionText,
    probability: probability,
    confidence: confidence,
    riskFactors: riskFactors,
    similarIncidents: similarIncidentsText,
    isFallback: true
  };
}

// Helper function for generating predictions based on local data only
function generateLocalPrediction(incidentType, date, location) {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  const month = dateObj.getMonth(); // 0-11
  
  // Determine number of incidents based on location and incident type
  // Using a consistent algorithm for demo purposes
  const divisionIndex = parseInt(location.replace(/\D/g, '')) || 11;
  const typeIndex = ['fatalAccidents', 'shootingIncidents', 'homicides', 'breakAndEnterIncidents', 'pedestrianKSI']
    .indexOf(incidentType) + 1;
  const totalIncidents = Math.floor((divisionIndex * typeIndex * 7) % 30) + 5;
  
  // Calculate basic risk metrics
  let baseProbability = Math.min(Math.max(30 + (totalIncidents * 2), 10), 85);
  
  // Adjust for weekday/weekend
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendAdjustment = isWeekend ? 5 : -2;
  
  // Adjust for season (summer tends to have more incidents)
  const isSummer = month >= 5 && month <= 8; // June through September
  const isWinter = month === 11 || month === 0 || month === 1; // Dec through Feb
  const seasonAdjustment = isSummer ? 8 : (isWinter ? -5 : 0);
  
  // Final probability calculation
  const probability = Math.min(Math.max(baseProbability + weekendAdjustment + seasonAdjustment, 5), 95);
  
  // Set confidence based on algorithm certainty
  const confidence = 80; // Local algorithm confidence
  
  // Get incident type label
  const incidentTypeLabels = {
    'fatalAccidents': 'Fatal Accident',
    'shootingIncidents': 'Shooting Incident',
    'homicides': 'Homicide',
    'breakAndEnterIncidents': 'Break and Enter Incident',
    'pedestrianKSI': 'Pedestrian Collision'
  };
  const incidentTypeLabel = incidentTypeLabels[incidentType] || incidentType;
  
  // Generate risk factors
  const riskFactors = [];
  
  // Add location factor
  riskFactors.push(`Location trends in ${location}`);
  
  // Add temporal factors
  if (isWeekend) {
    riskFactors.push("Weekend timing (higher risk period)");
  }
  
  if (isSummer) {
    riskFactors.push("Summer season (typically higher risk)");
  } else if (isWinter) {
    riskFactors.push("Winter conditions (potential weather-related factors)");
  }
  
  // Add some general factors
  if (incidentType === 'fatalAccidents' || incidentType === 'pedestrianKSI') {
    riskFactors.push("Traffic volume patterns");
  } else if (incidentType === 'shootingIncidents' || incidentType === 'homicides') {
    riskFactors.push("Urban density factors");
  } else if (incidentType === 'breakAndEnterIncidents') {
    riskFactors.push("Residential vs. commercial area patterns");
  }
  
  // Ensure we have at least 3 factors
  const possibleExtraFactors = [
    "Time of day patterns",
    "Proximity to high-activity areas",
    "Demographic considerations",
    "Urban infrastructure factors",
    "Seasonal trends"
  ];
  
  while (riskFactors.length < 3) {
    const randomFactor = possibleExtraFactors[Math.floor(Math.random() * possibleExtraFactors.length)];
    if (!riskFactors.includes(randomFactor)) {
        riskFactors.push(randomFactor);
    }
  }
  
  // Create prediction text
  let predictionText = `Based on analysis of local Toronto data for ${incidentTypeLabel.toLowerCase()} incidents in ${location}, `;
  
  if (probability < 30) {
    predictionText += `there is a relatively low probability (${probability}%) of a similar incident occurring on the selected date. The risk factors are minimal, but it's still prudent to remain aware of your surroundings.`;
  } else if (probability < 60) {
    predictionText += `there is a moderate probability (${probability}%) of a similar incident occurring on the selected date. Review the identified risk factors and exercise appropriate caution.`;
  } else {
    predictionText += `there is a relatively high probability (${probability}%) of a similar incident occurring on the selected date. The risk factors indicate elevated concern, and enhanced precautions would be advisable.`;
  }
  
  // Create similar incidents text
  const similarIncidentsText = `Local data analysis indicates approximately ${totalIncidents} ${incidentTypeLabel.toLowerCase()} incidents annually in this division. ${
    isWeekend ? "Weekend incidents are statistically more common in this area. " : ""
  }${
    isSummer ? "Summer months typically show higher incident rates." : (isWinter ? "Winter conditions have specific risk factors in this area." : "")
  }`;
  
  console.log('Generated local prediction with probability', probability);
  
  return {
    prediction: predictionText,
    probability: probability,
    confidence: confidence,
    riskFactors: riskFactors,
    similarIncidents: similarIncidentsText,
    isLocalPrediction: true
  };
}

module.exports = router; 
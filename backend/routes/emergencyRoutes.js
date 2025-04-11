const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const EmergencyContact = require('../models/EmergencyContact');
require('dotenv').config();

// Enhanced initialization with error handling
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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

module.exports = router; 
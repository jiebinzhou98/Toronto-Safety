const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const Homicide = require('../models/Homicide');
const ShootingIncidents = require('../models/ShootingIncidents');
const PedestrianKSI = require('../models/PedestrianKSI');
const BreakAndEnter = require('../models/BreakAndEnter');
const FatalAccident = require('../models/FatalAccident');
const { analyzeSafetyByNeighbourhood } = require('../services/predictionService');

// Helper function to get recent crime data summary
const getRecentCrimeSummary = async () => {
    try {
        console.log('Fetching recent crime data from MongoDB...');
        
        const [homicides, shootings, pedestrianKSI, breakAndEnter, fatalAccidents] = await Promise.all([
            Homicide.find().sort({ OCC_DATE: -1 }).limit(100),
            ShootingIncidents.find().sort({ OCC_DATE: -1 }).limit(100),
            PedestrianKSI.find().sort({ DATE: -1 }).limit(100),
            BreakAndEnter.find().sort({ OCC_DATE: -1 }).limit(100),
            FatalAccident.find().sort({ DATE: -1 }).limit(100)
        ]);

        console.log('Successfully fetched crime data:', {
            homicidesCount: homicides.length,
            shootingsCount: shootings.length,
            pedestrianKSICount: pedestrianKSI.length,
            breakAndEnterCount: breakAndEnter.length,
            fatalAccidentsCount: fatalAccidents.length
        });

        return {
            homicides: homicides.length,
            shootings: shootings.length,
            pedestrianIncidents: pedestrianKSI.length,
            breakAndEnter: breakAndEnter.length,
            fatalAccidents: fatalAccidents.length
        };
    } catch (error) {
        console.error('Error in getRecentCrimeSummary:', error);
        console.error('Error stack:', error.stack);
        return {
            homicides: 0,
            shootings: 0,
            pedestrianIncidents: 0,
            breakAndEnter: 0,
            fatalAccidents: 0
        };
    }
};

router.get('/safety-prediction', async (req, res) => {
    try {
        const predictions = await analyzeSafetyByNeighbourhood();
        res.json(predictions);
    } catch (error) {
        console.error('Error getting safety predictions:', error);
        res.status(500).json({ 
            error: 'Failed to get safety predictions',
            details: error.message 
        });
    }
});

// Chat endpoint for the AI assistant
router.post('/chat', async (req, res) => {
    console.log('Received chat request:', req.body);
    
    try {
        const { message } = req.body;

        if (!message) {
            console.log('No message provided in request');
            return res.status(400).json({ 
                message: 'Message is required',
                received: req.body
            });
        }

        // Get safety predictions
        const predictions = await analyzeSafetyByNeighbourhood();
        
        // Find mentioned neighbourhoods in the message
        const mentionedNeighbourhoods = predictions
            .filter(p => message.toLowerCase().includes(p.neighbourhood.toLowerCase()))
            .map(p => ({
                name: p.neighbourhood,
                riskLevel: p.riskLevel,
                riskScore: p.riskScore,
                incidents: p.incidents
            }));

        // Initialize Gemini AI
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }

        console.log('Initializing Gemini AI...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.3,
                topK: 20,
                topP: 0.8,
                maxOutputTokens: 400,
                stopSequences: ["User Question:"]
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                }
            ]
        });

        // Identify question type based on keywords
        const isResourceQuestion = message.toLowerCase().includes('resource') || 
                                 message.toLowerCase().includes('help') || 
                                 message.toLowerCase().includes('support') ||
                                 message.toLowerCase().includes('victim');

        // Create a context-aware prompt with safety predictions
        const prompt = `You are a helpful AI assistant specializing in Toronto's safety information. ${isResourceQuestion ? 'Provide supportive and resource-focused responses.' : 'Provide BRIEF and CONCISE responses with SPECIFIC NUMBERS from the data provided.'}

${!isResourceQuestion && mentionedNeighbourhoods.length > 0 ? `
Area Safety Data:
${mentionedNeighbourhoods.map(n => `
${n.name}:
• Risk Level: ${n.riskLevel} (${n.riskScore}/100)
• Current Incidents: ${Object.entries(n.incidents)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ')}
• 3-Month Predictions: ${Object.entries(n.predictions)
    .map(([type, count]) => `${type}: ~${count}`)
    .join(', ')}
• Trend: ${n.overallTrend > 0 ? '↑' : '↓'}${Math.abs(n.overallTrend)}%
`).join('\n')}` : ''}

User Question: ${message}

${isResourceQuestion ? `
Provide a SUPPORTIVE response in this format:
1. Immediate support resources (emergency numbers, hotlines)
2. Available victim services and organizations
3. Steps to get help
4. Additional support information
` : `
Provide a CONCISE response in this format:
1. One-line summary including specific numbers (risk score and trend)
2. Current statistics (use actual numbers)
3. 3-month predictions (use predicted numbers)
4. One specific safety tip
`}

Keep the entire response under 100 words.

After your response, add exactly three relevant follow-up questions in this EXACT format (including the ###):

### FOLLOW_UP_QUESTIONS
1. "What specific safety measures are recommended for this area?"
2. "How do these statistics compare to last year?"
3. "What are the safest times to visit this location?"
###

Make sure each follow-up question is:
1. Relevant to the user's original question
2. Specific and actionable
3. Focused on different aspects (e.g., prevention, comparison, timing)
Do not use generic placeholders like "First follow-up question" - make each question specific to the context.`;

        console.log('Sending prompt to Gemini...');

        try {
            // Generate the response using the latest API version
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });
            
            console.log('Received response from Gemini');
            const response = await result.response;
            const text = response.text();

            // Extract follow-up questions using the new format
            let followUpQuestions = [];
            let mainResponse = text;

            try {
                // Look for content between the ### markers
                const questionsMatch = text.match(/### FOLLOW_UP_QUESTIONS\n([\s\S]*?)\n###/);
                
                if (questionsMatch) {
                    // Extract the questions section
                    const questionsText = questionsMatch[1];
                    
                    // Parse the numbered questions and clean them
                    followUpQuestions = questionsText
                        .split('\n')
                        .filter(line => line.trim())
                        .map(line => {
                            // Extract just the question text, removing the number and quotes
                            const match = line.match(/\d+\.\s*"([^"]+)"/);
                            return match ? match[1] : null;
                        })
                        .filter(question => question !== null);

                    // Remove the follow-up questions section from the main response
                    mainResponse = text.split('### FOLLOW_UP_QUESTIONS')[0].trim();
                }
            } catch (parseError) {
                console.error('Error parsing follow-up questions:', parseError);
                // In case of error, keep the main response intact and return empty follow-up questions
            }

            res.json({
                response: mainResponse,
                followUpQuestions: followUpQuestions.slice(0, 3), // Ensure exactly 3 questions
                mentionedNeighbourhoods,
                timestamp: new Date().toISOString()
            });

        } catch (genError) {
            console.error('Gemini API Error:', genError);
            throw new Error(`Failed to generate response: ${genError.message}`);
        }

    } catch (error) {
        console.error('AI Chat Error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code
        });
        
        // Send a more detailed error response
        res.status(500).json({
            message: 'Error generating response',
            error: {
                message: error.message,
                name: error.name,
                code: error.code
            },
            details: process.env.NODE_ENV === 'development' ? {
                stack: error.stack
            } : undefined
        });
    }
});

module.exports = router; 
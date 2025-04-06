const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/current', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Weather API Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to fetch weather data',
            details: error.response?.data || error.message 
        });
    }
});

module.exports = router; 
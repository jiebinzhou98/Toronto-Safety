import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Card, 
    Typography, 
    Grid, 
    CircularProgress, 
    Alert,
    Chip,
    Stack,
    Paper,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import { 
    WbSunny as SunIcon,
    Opacity as RainIcon,
    Air as WindIcon,
    Visibility as VisibilityIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckCircle as SuccessIcon,
    ErrorOutline as ErrorIcon,
    ArrowForward as ArrowIcon
} from '@mui/icons-material';

const WeatherSafety = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedAdvice, setSelectedAdvice] = useState(null);

    useEffect(() => {
        fetchWeatherData();
    }, []);

    const fetchWeatherData = async () => {
        try {
            // Toronto coordinates
            const lat = 43.6532;
            const lon = -79.3832;
            const response = await fetch(`http://localhost:5000/api/weather/current?lat=${lat}&lon=${lon}`);
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            const data = await response.json();
            setWeatherData(data);
        } catch (err) {
            setError(err.message);
            console.error('Weather fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSafetyAdvice = (weatherData) => {
        const advice = [];
        if (!weatherData) return { advice: [], summary: '' };

        const temp = weatherData.main.temp;
        const windSpeed = weatherData.wind.speed;
        const visibility = weatherData.visibility;
        const conditions = weatherData.weather[0].main.toLowerCase();

        let overallRisk = 'low';
        let summaryPoints = [];

        // Temperature based advice
        if (temp < 0) {
            advice.push({
                type: 'warning',
                message: 'Risk of ice and frost. Take extra care when walking or driving.'
            });
            overallRisk = 'moderate';
            summaryPoints.push('icy conditions');
        } else if (temp > 30) {
            advice.push({
                type: 'warning',
                message: 'High temperature alert. Stay hydrated and avoid prolonged sun exposure.'
            });
            overallRisk = 'moderate';
            summaryPoints.push('heat risks');
        }

        // Wind based advice
        if (windSpeed > 10) {
            advice.push({
                type: 'warning',
                message: 'Strong winds may affect walking stability and driving conditions.'
            });
            overallRisk = 'moderate';
            summaryPoints.push('strong winds');
        }

        // Visibility based advice
        if (visibility < 5000) {
            advice.push({
                type: 'warning',
                message: 'Reduced visibility. Exercise caution while traveling.'
            });
            overallRisk = 'high';
            summaryPoints.push('poor visibility');
        }

        // Weather condition based advice
        if (conditions.includes('rain')) {
            advice.push({
                type: 'info',
                message: 'Wet conditions may increase slip hazards. Carry an umbrella.'
            });
            summaryPoints.push('wet conditions');
        } else if (conditions.includes('snow')) {
            advice.push({
                type: 'warning',
                message: 'Snowy conditions. Be aware of slippery surfaces and reduced visibility.'
            });
            overallRisk = 'high';
            summaryPoints.push('snowy conditions');
        } else if (conditions.includes('clear')) {
            advice.push({
                type: 'success',
                message: 'Good weather conditions for outdoor activities.'
            });
        }

        // Generate summary
        let summary = '';
        if (summaryPoints.length > 0) {
            summary = `Current weather presents ${overallRisk} risk due to ${summaryPoints.join(' and ')}. `;
            summary += overallRisk === 'high' 
                ? 'Exercise extreme caution when traveling.' 
                : overallRisk === 'moderate'
                ? 'Take necessary precautions for your safety.'
                : 'Generally safe conditions for outdoor activities.';
        } else {
            summary = 'Current weather conditions are favorable with no significant safety concerns.';
        }

        return { advice, summary, overallRisk };
    };

    const getDetailedAdvice = (type, condition) => {
        const details = {
            temperature: {
                cold: [
                    'Wear layers of warm clothing',
                    'Keep extremities covered',
                    'Watch for signs of frostbite',
                    'Check on elderly neighbors',
                    'Ensure your vehicle has winter emergency supplies'
                ],
                hot: [
                    'Stay hydrated with regular water intake',
                    'Avoid prolonged sun exposure between 10am-4pm',
                    'Wear light, breathable clothing',
                    'Use sunscreen and wear a hat',
                    'Look for shaded areas when outdoors'
                ]
            },
            wind: [
                'Secure loose objects around your property',
                'Keep a safe distance from trees and power lines',
                'Be cautious of sudden gusts while driving',
                'Hold handrails when using stairs outdoors',
                'Watch for flying debris'
            ],
            visibility: [
                'Use vehicle lights even during daytime',
                'Maintain extra distance from other vehicles',
                'Reduce driving speed significantly',
                'Stay on marked paths when walking',
                'Wear reflective clothing if possible'
            ],
            rain: [
                'Use non-slip footwear',
                'Carry an umbrella or raincoat',
                'Watch for puddles and slippery surfaces',
                'Allow extra time for travel',
                'Be cautious of reduced visibility while driving'
            ],
            snow: [
                'Wear appropriate winter boots',
                'Clear snow from walkways and use salt/sand',
                'Keep emergency supplies in your vehicle',
                'Plan routes along major cleared roads',
                'Watch for black ice and hidden hazards'
            ],
            clear: [
                'Still apply sunscreen on sunny days',
                'Stay hydrated even in mild conditions',
                'Be aware of changing weather conditions',
                'Carry basic safety supplies',
                'Plan outdoor activities during daylight hours'
            ]
        };

        return details[type]?.[condition] || details[type] || [];
    };

    const handleAdviceClick = (advice) => {
        let adviceType = '';
        let condition = '';

        // Determine advice type and condition based on the message
        if (advice.message.includes('ice and frost')) {
            adviceType = 'temperature';
            condition = 'cold';
        } else if (advice.message.includes('High temperature')) {
            adviceType = 'temperature';
            condition = 'hot';
        } else if (advice.message.includes('winds')) {
            adviceType = 'wind';
        } else if (advice.message.includes('visibility')) {
            adviceType = 'visibility';
        } else if (advice.message.includes('wet conditions')) {
            adviceType = 'rain';
        } else if (advice.message.includes('Snowy conditions')) {
            adviceType = 'snow';
        } else if (advice.message.includes('Good weather')) {
            adviceType = 'clear';
        }

        setSelectedAdvice({
            type: advice.type,
            message: advice.message,
            details: getDetailedAdvice(adviceType, condition)
        });
        setOpenDialog(true);
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
                Toronto Weather Safety
            </Typography>

            {weatherData && (
                <Grid container spacing={3}>
                    {/* Current Weather Card */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Current Weather Conditions
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SunIcon />
                                    <Typography>
                                        Temperature: {Math.round(weatherData.main.temp)}°C
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <RainIcon />
                                    <Typography>
                                        Humidity: {weatherData.main.humidity}%
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WindIcon />
                                    <Typography>
                                        Wind: {weatherData.wind.speed} m/s
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <VisibilityIcon />
                                    <Typography>
                                        Visibility: {weatherData.visibility / 1000} km
                                    </Typography>
                                </Box>
                                <Box sx={{ mt: 2 }}>
                                    <Chip 
                                        label={weatherData.weather[0].description}
                                        color="primary"
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Weather Safety Analysis Card */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WarningIcon color="warning" />
                                Safety Impact Analysis
                            </Typography>
                            
                            {/* Summary Section */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <InfoIcon color="info" />
                                    Summary
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    {getSafetyAdvice(weatherData).summary}
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Chip 
                                        label={`Risk Level: ${getSafetyAdvice(weatherData).overallRisk.toUpperCase()}`}
                                        color={
                                            getSafetyAdvice(weatherData).overallRisk === 'high' ? 'error' :
                                            getSafetyAdvice(weatherData).overallRisk === 'moderate' ? 'warning' : 'success'
                                        }
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Detailed Advice Section */}
                            <Typography variant="subtitle1" gutterBottom>
                                Detailed Safety Advice
                            </Typography>
                            <Stack spacing={2}>
                                {getSafetyAdvice(weatherData).advice.map((advice, index) => (
                                    <Button
                                        key={index}
                                        variant="outlined"
                                        color={
                                            advice.type === 'warning' ? 'warning' :
                                            advice.type === 'error' ? 'error' :
                                            advice.type === 'success' ? 'success' : 'info'
                                        }
                                        onClick={() => handleAdviceClick(advice)}
                                        startIcon={
                                            advice.type === 'warning' ? <WarningIcon /> :
                                            advice.type === 'error' ? <ErrorIcon /> :
                                            advice.type === 'success' ? <SuccessIcon /> : <InfoIcon />
                                        }
                                        fullWidth
                                        sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1 }}
                                    >
                                        {advice.message}
                                    </Button>
                                ))}
                            </Stack>

                            {/* Detailed Advice Dialog */}
                            <Dialog
                                open={openDialog}
                                onClose={() => setOpenDialog(false)}
                                maxWidth="sm"
                                fullWidth
                            >
                                <DialogTitle sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1,
                                    bgcolor: selectedAdvice?.type === 'warning' ? '#fff3e0' :
                                            selectedAdvice?.type === 'error' ? '#ffebee' :
                                            selectedAdvice?.type === 'success' ? '#e8f5e9' : '#e3f2fd'
                                }}>
                                    {selectedAdvice?.type === 'warning' ? <WarningIcon color="warning" /> :
                                     selectedAdvice?.type === 'error' ? <ErrorIcon color="error" /> :
                                     selectedAdvice?.type === 'success' ? <SuccessIcon color="success" /> : 
                                     <InfoIcon color="info" />}
                                    Safety Recommendations
                                </DialogTitle>
                                <DialogContent>
                                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                        {selectedAdvice?.message}
                                    </Typography>
                                    <List>
                                        {selectedAdvice?.details.map((detail, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon>
                                                    <ArrowIcon color="primary" />
                                                </ListItemIcon>
                                                <ListItemText primary={detail} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setOpenDialog(false)} color="primary">
                                        Close
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default WeatherSafety; 
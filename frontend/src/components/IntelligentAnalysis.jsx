import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Paper, 
    CircularProgress, 
    Alert,
    IconButton,
    Tooltip,
    Chip,
    Collapse,
    Card,
    CardContent,
    LinearProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import WarningIcon from '@mui/icons-material/Warning';
import LoginIcon from '@mui/icons-material/Login';

const IntelligentAnalysis = () => {
    const { isSignedIn, openSignIn } = useAuth();
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const chatEndRef = useRef(null);

    // Auto scroll to bottom when chat history updates
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSubmit = async (e, selectedQuestion = null) => {
        e?.preventDefault(); // Make preventDefault optional since we might not have an event object
        
        const questionToAsk = selectedQuestion || message;
        if (!questionToAsk.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Show the selected question in the chat history immediately
            if (selectedQuestion) {
                const newUserMessage = {
                    role: 'user',
                    content: selectedQuestion,
                    timestamp: new Date().toISOString()
                };
                setChatHistory(prev => [...prev, newUserMessage]);
            }

            const response = await axios.post('http://localhost:5000/api/agent/chat', {
                message: questionToAsk
            });

            // Only add user message if it wasn't a selected question (already added above)
            if (!selectedQuestion) {
                const newMessage = {
                    role: 'user',
                    content: questionToAsk,
                    timestamp: new Date().toISOString()
                };
                setChatHistory(prev => [...prev, newMessage]);
            }

            const assistantResponse = {
                role: 'assistant',
                content: response.data.response,
                followUpQuestions: response.data.followUpQuestions || [],
                mentionedNeighbourhoods: response.data.mentionedNeighbourhoods || [],
                timestamp: response.data.timestamp
            };

            setChatHistory(prev => [...prev, assistantResponse]);
            if (!selectedQuestion) {
                setMessage(''); // Only clear the input if it's a manual submission
            }
        } catch (error) {
            console.error('Chat error details:', error);
            setError(
                error.response?.data?.error?.message || 
                error.response?.data?.message || 
                'Failed to get response from the AI assistant. Please try again.'
            );
            
            // Remove the user message if the request failed
            if (selectedQuestion) {
                setChatHistory(prev => prev.slice(0, -1));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'Very High': return '#d32f2f';
            case 'High': return '#f44336';
            case 'Moderate': return '#ff9800';
            case 'Low': return '#4caf50';
            case 'Very Low': return '#2e7d32';
            default: return '#757575';
        }
    };

    if (!isSignedIn) {
        return (
            <Box 
                sx={{ 
                    maxWidth: 800, 
                    margin: '0 auto', 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 3 
                }}
            >
                <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Toronto Safety Assistant
                </Typography>
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: 400,
                        backgroundColor: '#f5f5f5'
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Welcome to Toronto Safety Assistant
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                        Please sign in to start using the safety assistant.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<LoginIcon />}
                        onClick={() => openSignIn()}
                        sx={{
                            backgroundColor: '#1976d2',
                            '&:hover': {
                                backgroundColor: '#1565c0',
                            }
                        }}
                    >
                        Sign In
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                Toronto Safety Assistant
            </Typography>
            
            {/* Chat History */}
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 2, 
                    mb: 2, 
                    height: '60vh', 
                    overflowY: 'auto',
                    backgroundColor: '#f5f5f5',
                    scrollBehavior: 'smooth'
                }}
            >
                {chatHistory.map((msg, index) => (
                    <Box 
                        key={index}
                        sx={{
                            mb: 2,
                            p: 2,
                            backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#ffffff',
                            borderRadius: 2,
                            maxWidth: '90%',
                            ml: msg.role === 'user' ? 'auto' : 0,
                            mr: msg.role === 'user' ? 0 : 'auto',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                whiteSpace: 'pre-wrap',
                                mb: 1,
                                color: msg.role === 'user' ? '#1565c0' : '#2c3e50'
                            }}
                        >
                            {msg.content}
                        </Typography>
                        
                        {/* Safety Predictions */}
                        {msg.role === 'assistant' && msg.mentionedNeighbourhoods && msg.mentionedNeighbourhoods.length > 0 && (
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                                    Safety Analysis:
                                </Typography>
                                {msg.mentionedNeighbourhoods.map((hood, index) => (
                                    <Card key={index} sx={{ mb: 1, backgroundColor: '#fafafa' }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                    {hood.name}
                                                </Typography>
                                                <Chip 
                                                    icon={<WarningIcon />}
                                                    label={`Risk Level: ${hood.riskLevel}`}
                                                    sx={{ 
                                                        ml: 2,
                                                        backgroundColor: getRiskColor(hood.riskLevel),
                                                        color: 'white'
                                                    }}
                                                    size="small"
                                                />
                                            </Box>
                                            <Box sx={{ width: '100%', mb: 1 }}>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={hood.riskScore} 
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 4,
                                                        backgroundColor: '#e0e0e0',
                                                        '& .MuiLinearProgress-bar': {
                                                            backgroundColor: getRiskColor(hood.riskLevel)
                                                        }
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ color: '#666' }}>
                                                    Risk Score: {hood.riskScore}/100
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Recent Incidents:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                                {Object.entries(hood.incidents).map(([type, count], i) => (
                                                    type !== 'total' && (
                                                        <Chip
                                                            key={i}
                                                            label={`${type.replace(/([A-Z])/g, ' $1').trim()}: ${count}`}
                                                            size="small"
                                                            sx={{ backgroundColor: '#e3f2fd' }}
                                                        />
                                                    )
                                                ))}
                                            </Box>
                                            
                                            {/* Trends and Predictions */}
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    3-Month Predictions:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {Object.entries(hood.predictions || {}).map(([type, prediction], i) => (
                                                        <Chip
                                                            key={i}
                                                            label={`${type.replace(/([A-Z])/g, ' $1').trim()}: ~${prediction}`}
                                                            size="small"
                                                            sx={{ 
                                                                backgroundColor: '#fff3e0',
                                                                '& .MuiChip-label': {
                                                                    color: '#e65100'
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                            
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Trends (% change):
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {Object.entries(hood.trends || {}).map(([type, trend], i) => (
                                                        <Chip
                                                            key={i}
                                                            label={`${type.replace(/([A-Z])/g, ' $1').trim()}: ${trend > 0 ? '+' : ''}${Math.round(trend)}%`}
                                                            size="small"
                                                            sx={{ 
                                                                backgroundColor: trend > 0 ? '#ffebee' : '#e8f5e9',
                                                                '& .MuiChip-label': {
                                                                    color: trend > 0 ? '#c62828' : '#2e7d32'
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        display: 'block', 
                                                        mt: 1,
                                                        color: hood.overallTrend > 0 ? '#c62828' : '#2e7d32'
                                                    }}
                                                >
                                                    Overall Trend: {hood.overallTrend > 0 ? '+' : ''}{hood.overallTrend}%
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                        
                        {/* Follow-up Questions */}
                        {msg.role === 'assistant' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                                    Follow-up Questions:
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {msg.followUpQuestions.map((question, qIndex) => (
                                        <Button
                                            key={qIndex}
                                            variant="outlined"
                                            size="small"
                                            sx={{ 
                                                backgroundColor: '#ffffff',
                                                '&:hover': {
                                                    backgroundColor: '#e3f2fd'
                                                },
                                                borderColor: '#1976d2',
                                                color: '#1976d2',
                                                justifyContent: 'flex-start',
                                                textAlign: 'left',
                                                textTransform: 'none',
                                                whiteSpace: 'normal',
                                                wordWrap: 'break-word'
                                            }}
                                            onClick={(e) => handleSubmit(e, question)}
                                            disabled={loading}
                                        >
                                            {`${qIndex + 1}. ${question}`}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                        )}
                        
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                display: 'block',
                                color: 'text.secondary',
                                mt: 1
                            }}
                        >
                            {new Date(msg.timestamp).toLocaleString()}
                        </Typography>
                    </Box>
                ))}
                
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}
                <div ref={chatEndRef} />
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        variant="outlined"
                        placeholder="Ask about safety in Toronto... (Press Enter to send)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1976d2',
                                },
                            },
                        }}
                    />
                    <Tooltip title="Send message">
                        <IconButton
                            type="submit"
                            disabled={loading || !message.trim()}
                            color="primary"
                            sx={{ 
                                alignSelf: 'flex-end',
                                mb: 1,
                                backgroundColor: message.trim() ? '#1976d2' : 'transparent',
                                color: message.trim() ? 'white' : 'inherit',
                                '&:hover': {
                                    backgroundColor: message.trim() ? '#1565c0' : 'transparent',
                                }
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </form>
        </Box>
    );
};

export default IntelligentAnalysis; 
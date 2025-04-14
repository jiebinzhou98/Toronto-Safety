{/* This is the corrected JSX for the Chat History section */}
{chatHistory.map((msg, index) => (
    <Paper 
        key={index}
        elevation={msg.isError ? 0 : 1}
        sx={{ 
            p: 2,
            mb: 2,
            borderRadius: 2,
            backgroundColor: msg.isError ? '#ffebee' : (msg.role === 'user' ? '#e3f2fd' : '#f8f9fa'),
            border: msg.isError ? '1px solid #ffcdd2' : 'none'
        }}
    >
        {msg.role === 'user' ? (
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <PersonIcon sx={{ mr: 1, color: '#1976d2' }} />
                <Box>
                    <Typography variant="body1">{msg.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                    </Typography>
                </Box>
            </Box>
        ) : (
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <PredictionIcon sx={{ mr: 1, color: msg.isError ? '#d32f2f' : '#4caf50' }} />
                <Box sx={{ width: '100%' }}>
                    <Typography variant="body1">{msg.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                    </Typography>
                    
                    {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Follow-up questions:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {msg.followUpQuestions.map((q, idx) => (
                                    <Chip 
                                        key={idx} 
                                        label={q}
                                        onClick={() => handleSubmit(null, q)}
                                        sx={{ 
                                            cursor: 'pointer',
                                            '&:hover': { backgroundColor: '#e3f2fd' }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                    
                    {msg.role === 'assistant' && msg.isPrediction && msg.predictionData && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="body2" color="text.secondary">Probability:</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="#d32f2f">
                                        {msg.predictionData.probability}%
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="body2" color="text.secondary">Confidence Level:</Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {msg.predictionData.confidence}%
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="body2" color="text.secondary">Model:</Typography>
                                    <Typography variant="body1">
                                        {msg.predictionData.isLocalPrediction ? 'Local Analysis' : 
                                         msg.predictionData.modelType === 'gemini' ? 'Gemini AI' : 
                                         msg.predictionData.modelType === 'statistical' ? 'Statistical' : 
                                         msg.predictionData.modelType === 'hybrid' ? 'Hybrid' : 'ML Model'}
                                        {msg.predictionData.isLocalPrediction && 
                                            <Chip 
                                                size="small" 
                                                label="Fallback" 
                                                sx={{ ml: 1, backgroundColor: '#fff3e0', color: '#e65100' }} 
                                            />
                                        }
                                        {msg.predictionData.isFallback && 
                                            <Chip 
                                                size="small" 
                                                label="Fallback" 
                                                sx={{ ml: 1, backgroundColor: '#fff3e0', color: '#e65100' }} 
                                            />
                                        }
                                    </Typography>
                                </Grid>
                            </Grid>
                            
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Key Risk Factors:</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                                        {msg.predictionData.riskFactors.map((factor, idx) => (
                                            <Chip key={idx} label={factor} size="small" />
                                        ))}
                                    </Box>
                                </Grid>
                            </Grid>
                            
                            {msg.predictionData.similarIncidents && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Similar Incidents:</Typography>
                                    <Typography variant="body2">
                                        {msg.predictionData.similarIncidents}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>
        )}
    </Paper>
))} 
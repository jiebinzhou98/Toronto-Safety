// Simple script to fix the JSX syntax issue
const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(
  __dirname, 
  'frontend', 
  'src', 
  'components', 
  'IntelligentAnalysis.jsx'
);

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix the problematic part - replacing the nested structure with a properly formatted one
// Identifying the problematic section
const problematicStart = content.indexOf('{msg.role === \'assistant\' && msg.isPrediction && msg.predictionData && (');
const problematicEnd = content.indexOf('</Paper>\n                ))}');

if (problematicStart !== -1 && problematicEnd !== -1) {
  // Extract the section before and after the problematic part
  const beforeSection = content.substring(0, problematicStart);
  const afterSection = content.substring(problematicEnd + 30); // Move past the problematic section

  // The corrected section
  const correctedSection = `{msg.role === 'assistant' && msg.isPrediction && msg.predictionData && (
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
                ))}`;

  // Replace the problematic section with the corrected one
  const fixedContent = beforeSection + correctedSection + afterSection;

  // Write the fixed content back to the file
  fs.writeFileSync(filePath, fixedContent, 'utf8');
  console.log('File fixed successfully!');
} else {
  console.error('Could not find the problematic section in the file.');
} 
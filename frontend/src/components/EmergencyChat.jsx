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
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import EmergencyIcon from '@mui/icons-material/Emergency';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const EmergencyChat = () => {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Safety tips for emergency vehicle responses
  const safetyTips = [
    {
      icon: <WarningIcon />,
      text: "🚨 Remember to stay calm and check your mirrors before moving over"
    },
    {
      icon: <DirectionsCarIcon />,
      text: "🚗 Keep a safe distance from emergency vehicles - at least 500 feet (150m) when following"
    },
    {
      icon: <VolumeUpIcon />,
      text: "🔊 Turn down your radio when you see flashing lights"
    },
    {
      icon: <VisibilityIcon />,
      text: "👀 Regularly scan ahead while driving to spot emergency vehicles early"
    },
    {
      icon: <SchoolIcon />,
      text: "📚 Learn more: Many DMV websites have free guides on emergency vehicle protocols"
    },
    {
      icon: <LocationOnIcon />,
      text: "🗺️ When navigating, note nearby hospitals/fire stations along your route"
    }
  ];

  // Configure axios instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      setMessages(prev => [...prev, { text: input, sender: 'user' }]);
      
      const response = await api.post('/emergency/chat', { 
        message: input 
      });

      // Add AI response
      setMessages(prev => [...prev, { 
        text: response.data.text, 
        sender: 'bot',
        emergencyContacts: response.data.emergencyContacts
      }]);

      // Check if message is about emergency vehicles
      const isEmergencyVehicleQuery = 
        input.toLowerCase().includes('emergency vehicle') || 
        input.toLowerCase().includes('ambulance') || 
        input.toLowerCase().includes('police car') ||
        input.toLowerCase().includes('fire truck');

      // Add safety tips if relevant
      if (isEmergencyVehicleQuery) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { 
              text: "🚑 Helpful Safety Reminders:", 
              sender: 'bot',
              isHeading: true 
            },
            ...safetyTips.map(tip => ({
              text: tip.text,
              icon: tip.icon,
              sender: 'bot',
              isTip: true
            })),
            { 
              text: "Would you like more information about emergency vehicle protocols?", 
              sender: 'bot',
              isFollowUp: true 
            }
          ]);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Chat Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      setError(error.response?.data?.error || 'Failed to get response. Please try again.');
      setMessages(prev => [...prev, {
        text: "I'm having trouble connecting. For immediate help, call 911.",
        sender: 'bot',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const renderMessage = (message, index) => {
    if (message.isHeading) {
      return (
        <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 1 }}>
          {message.text}
        </Typography>
      );
    }

    if (message.isTip) {
      return (
        <ListItem sx={{ 
          bgcolor: 'background.paper',
          borderRadius: 1,
          mb: 1,
          boxShadow: 1
        }}>
          <ListItemIcon>
            {message.icon}
          </ListItemIcon>
          <ListItemText primary={message.text} />
        </ListItem>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <Paper
          sx={{
            p: 2,
            maxWidth: '70%',
            backgroundColor: message.sender === 'user' ? '#e3f2fd' : '#fff',
            color: message.isError ? 'error.main' : 'text.primary',
          }}
        >
          <Typography variant="body1">{message.text}</Typography>
          {message.emergencyContacts && message.emergencyContacts.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="primary">
                Emergency Contacts:
              </Typography>
              {message.emergencyContacts.map((contact, idx) => (
                <Typography key={idx} variant="body2">
                  {contact.name} ({contact.category}): {contact.phone}
                </Typography>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  if (!isSignedIn) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="h6" color="error">
          Please sign in to use the emergency chat
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Button
        variant="contained"
        color="error"
        startIcon={<EmergencyIcon />}
        onClick={handleOpen}
        sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
      >
        Emergency Chat
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Emergency Assistance Chat
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
            <Paper
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                mb: 2,
                backgroundColor: '#f5f5f5',
              }}
            >
              {messages.map((message, index) => (
                <Box key={index}>
                  {renderMessage(message, index)}
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your emergency situation..."
                  disabled={isLoading}
                  multiline
                  maxRows={3}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading || !input.trim()}
                  sx={{ minWidth: 100 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
                </Button>
              </Box>
            </form>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmergencyChat; 
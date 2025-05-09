//
API
Service
//
Import
axios
import axios from 'axios';

// API base URL
const API_URL = 'http://localhost:5000/api';

// Function to parse natural language query for map
export const parseMapQuery = async (query) => {
  try {
    // Use the emergency parseQuery endpoint that's already in the backend
    const response = await axios.post(${API_URL}/emergency/parseQuery, { query });

    // If parameters were successfully parsed, return them
    return response.data?.parameters || null;
  } catch (error) {
    console.error('Error parsing map query:', error);
    return null;
  }
};

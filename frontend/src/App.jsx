import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, useAuth, RedirectToSignIn } from '@clerk/clerk-react';
import { ApolloProvider, ApolloClient, InMemoryCache, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { HttpLink } from '@apollo/client/link/http';
import Navbar from './components/Navbar';
import DiscussionBoard from './components/DiscussionBoard';
import MapContainer from './components/MapContainer';
import FilterSidebar from './components/FilterSidebar';
import LoadingIndicator from './components/LoadingIndicator';
import DivisionFilter from './components/DivisionFilter';
import IntelligentAnalysis from './components/IntelligentAnalysis';
import WeatherSafety from './components/WeatherSafety';
import EmergencyChat from './components/EmergencyChat';
import { Box, Button, Typography, Paper } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import './App.css';

// Create error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  if (networkError) console.log(`[Network error]: ${networkError}`);
});

// Create retry link
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true
  },
  attempts: {
    max: 5,
    retryIf: (error, _operation) => !!error
  }
});

// Create HTTP link
const httpLink = new HttpLink({
  uri: 'http://localhost:5000/graphql',
  credentials: 'same-origin'
});

// Create Apollo Client
const client = new ApolloClient({
  link: from([errorLink, retryLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});

function WelcomePage() {
  const { openSignIn } = useAuth();
  const [redirectToSignIn, setRedirectToSignIn] = useState(false);
  
  if (redirectToSignIn) {
    return <RedirectToSignIn />;
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 3
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 6,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 2
        }}
      >
        <Typography variant="h3" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', mb: 4 }}>
          Toronto Safety Assistant
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, color: '#666' }}>
          Welcome to Toronto's Intelligent Safety Analysis Platform
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
          Access real-time safety insights, crime statistics, and AI-powered analysis to make informed decisions about safety in Toronto.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<LoginIcon />}
          onClick={() => setRedirectToSignIn(true)}
          sx={{
            py: 2,
            px: 4,
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
            fontSize: '1.1rem'
          }}
        >
          Sign In to Get Started
        </Button>
      </Paper>
    </Box>
  );
}

function App() {
  const [activeFilters, setActiveFilters] = useState({
    fatalAccidents: false,
    shootingIncidents: false,
    homicides: false,
    breakAndEnterIncidents: false,
    pedestrianKSI: false,
  });

  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const toggleFilter = (filterName) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  const applyFilters = () => {
    setIsLoading(true);
  };

  return (
    <ApolloProvider client={client}>
      <Router>
        <div className="App">
          <SignedIn>
            <Navbar />
            <Routes>
              <Route path="/" element={
                <div className="app-content">
                  <FilterSidebar
                    activeFilters={activeFilters}
                    toggleFilter={toggleFilter}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    applyFilters={applyFilters}
                  />
                  <div className="main-content">
                    <DivisionFilter />
                    <div className="map-section">
                      <MapContainer
                        activeFilters={activeFilters}
                        dateRange={dateRange}
                        setIsLoading={setIsLoading}
                      />
                    </div>
                    <div className="intelligent-analysis">
                      
                    </div>
                  </div>
                </div>
              } />
              <Route path="/discussion" element={<DiscussionBoard />} />
              <Route path="/intelianalysis" element={<IntelligentAnalysis />} />
              <Route path="/weather" element={<WeatherSafety />} />
            </Routes>
            <EmergencyChat />
          </SignedIn>
          <SignedOut>
            <Routes>
              <Route path="*" element={<WelcomePage />} />
            </Routes>
          </SignedOut>
          {isLoading && <LoadingIndicator />}
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
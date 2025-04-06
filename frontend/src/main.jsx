import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { ClerkProvider } from '@clerk/clerk-react'

const httpLink = createHttpLink({
  uri: 'http://localhost:5000/graphql',
  credentials: 'include'
});

const authLink = setContext((_, { headers }) => {
  // For development, you can add a mock token
  if (process.env.NODE_ENV === 'development') {
    return {
      headers: {
        ...headers,
        authorization: 'Bearer dev-token',
      }
    };
  }

  // Get the authentication token from Clerk if it exists
  const token = localStorage.getItem('clerk-token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
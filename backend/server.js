const express = require("express")
const { ApolloServer } = require("@apollo/server")
const { expressMiddleware } = require("@apollo/server/express4")
const cors = require("cors")
const mongoose = require("mongoose")
const { typeDefs } = require("./schema/typeDefs")
const { resolvers } = require("./schema/resolvers")
require("dotenv").config()
const jwt = require("jsonwebtoken")
const homicideRoutes = require('./routes/Homicide');
const agentRoutes = require('./routes/agentRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

const app = express()
const PORT = process.env.PORT || 5000

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 100,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Middleware to check JWT token
const authenticateJWT = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  // Extract token from Bearer "token"
  const bearerToken = token.split(" ")[1];

  // Verify the token
  jwt.verify(bearerToken, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send("Invalid token");
    }

    req.user = user;
    next();
  });
};

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Allow both ports
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

async function startServer() {
  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization || "";
      let user = null;

      if (token && process.env.NODE_ENV === 'development') {
        try {
          user = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        } catch (error) {
          console.error("Error verifying token:", error);
        }
      }
      return { user };
    },
  })

  // Start Apollo Server
  await server.start()

  // Apply middleware
  app.use(cors(corsOptions))
  app.use(express.json())
  
  // Development bypass for testing
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.log('Warning: Authentication bypass is enabled');
    app.use('/api/agent', agentRoutes);
    app.use('/api/weather', weatherRoutes);
  } else {
    app.use('/api/agent', authenticateJWT, agentRoutes);
    app.use('/api/weather', authenticateJWT, weatherRoutes);
  }
  
  // Apply Apollo middleware with CORS
  app.use("/graphql", cors(corsOptions), expressMiddleware(server, {
    context: async ({ req }) => {
      // For development, bypass authentication
      if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
        return { user: { id: 'dev-user' } };
      }

      const token = req.headers.authorization || "";
      let user = null;

      if (token) {
        try {
          user = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        } catch (error) {
          console.error("Error verifying token:", error);
        }
      }
      return { user };
    }
  }))

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

startServer()
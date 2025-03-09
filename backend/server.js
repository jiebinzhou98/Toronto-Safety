const express = require("express")
const { ApolloServer } = require("@apollo/server")
const { expressMiddleware } = require("@apollo/server/express4")
const cors = require("cors")
const mongoose = require("mongoose")
const { typeDefs } = require("./schema/typeDefs")
const { resolvers } = require("./schema/resolvers")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 5000

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

async function startServer() {
  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })

  // Start Apollo Server
  await server.start()

  // Apply middleware
  app.use(cors())
  app.use(express.json())

  // Apply Apollo middleware
  app.use("/graphql", expressMiddleware(server))

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`)
  })
}

startServer()


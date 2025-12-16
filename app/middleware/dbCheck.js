const mongoose = require('mongoose')

/**
 * Middleware to check database connection state
 * Logs warnings if database is not connected
 */
const checkDatabaseConnection = (req, res, next) => {
  const connectionState = mongoose.connection.readyState

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (connectionState !== 1) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }

    console.warn(
      `⚠️  Database connection state: ${states[connectionState]} (${connectionState})`
    )
    console.warn(`⚠️  Request path: ${req.path}`)

    // In production, log more details
    if (process.env.NODE_ENV === 'production') {
      console.warn(`⚠️  MONGODB_URI set: ${!!process.env.MONGODB_URI}`)
      console.warn(
        `⚠️  MONGODB_URI starts with: ${
          process.env.MONGODB_URI
            ? process.env.MONGODB_URI.substring(0, 20) + '...'
            : 'NOT SET'
        }`
      )
    }
  }

  next()
}

/**
 * Helper function to check if database is connected before executing queries
 * Throws an error if not connected
 */
const ensureDatabaseConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error('Database is not connected')
    error.code = 'DB_NOT_CONNECTED'
    throw error
  }
}

module.exports = { checkDatabaseConnection, ensureDatabaseConnected }

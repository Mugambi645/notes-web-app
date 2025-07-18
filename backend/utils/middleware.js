// backend/utils/middleware.js
const logger = require('./logger')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    // This specifically catches errors when an ID is malformed (e.g., not a valid ObjectId format)
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    // Catches Mongoose validation errors (e.g., required field missing)
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.code === 11000) {
    // Catches duplicate key errors (e.g., unique username violation)
    return response.status(400).json({ error: 'expected `username` to be unique' }) // Ensure this matches test or adjust test
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: 'invalid token' })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired'
    })
  }

  // For any other unhandled errors, pass to default Express error handler
  next(error)
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler
}
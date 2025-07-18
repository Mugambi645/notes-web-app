/**
 * @file This file defines the API routes for user management.
 * @module routes/users
 * @requires express
 * @requires ../models/user
 * @requires bcrypt
 */

const usersRouter = require('express').Router() // <--- THIS LINE IS ESSENTIAL
const User = require('../models/user')       // <--- IMPORT THE USER MODEL
const bcrypt = require('bcrypt')             // <--- IMPORT BCRYPT FOR PASSWORD HASHING

/**
 * Handles POST requests to create a new user.
 * Requires 'username', 'name', and 'password' in the request body.
 * Passwords must be at least 3 characters long.
 * Hashes the password before saving the user.
 * Handles duplicate username errors.
 * @function
 * @param {Object} request - The Express request object.
 * @param {Object} response - The Express response object.
 * @param {Function} next - The Express next middleware function for error handling.
 * @returns {Promise<void>} A promise that resolves when the new user is sent as a JSON response with status 201, or a 400 status for validation/duplicate errors, or passes other errors to the next middleware.
 */
usersRouter.post('/', async (request, response, next) => {
  try {
    const { username, name, password } = request.body

    // Validate password length
    if (!password || password.length < 3) {
      return response.status(400).json({
        error: 'password must be at least 3 characters long',
      })
    }

    // Hash the password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create a new User instance
    const user = new User({
      username,
      name,
      passwordHash,
    })

    // Save the new user to the database
    const savedUser = await user.save()
    response.status(201).json(savedUser)
  } catch (error) {
    // Handle duplicate username error (MongoDB error code 11000)
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return response.status(400).json({ error: 'username must be unique' })
    }

    // Pass any other errors to the next middleware (error handling middleware)
    next(error)
  }
})

// You would typically have other routes here, for example, to get all users:
/**
 * Handles GET requests to retrieve all users.
 * Populates the 'notes' field with note content and importance.
 * @function
 * @param {Object} request - The Express request object.
 * @param {Object} response - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the users are sent as a JSON response.
 */
usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('notes', { content: 1, important: 1 })
  response.json(users)
})


/**
 * Exports the users router for use in the main application.
 * @type {Object}
 */
module.exports = usersRouter
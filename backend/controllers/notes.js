// backend/controllers/notes.js
const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')

notesRouter.get('/', async (request, response) => {
  const notes = await Note.find({}).populate('user', { username: 1, name: 1 })
  response.json(notes)
})

notesRouter.get('/:id', async (request, response, next) => { // <-- Ensure 'next' is here
  try {
    const note = await Note.findById(request.params.id).populate('user', { username: 1, name: 1 })
    if (note) {
      response.json(note)
    } else {
      response.status(404).end()
    }
  } catch (error) {
    next(error) // <--- Crucial: Pass errors (like CastError) to middleware
  }
})

notesRouter.post('/', async (request, response, next) => { // <-- Ensure 'next' is here
  const body = request.body

  try { // <-- Wrap in try/catch to catch errors like Mongoose validation or missing user
    const user = await User.findById(body.userId)

    if (!user) {
      return response.status(400).json({ error: 'UserId missing or not valid' })
    }

    const note = new Note({
      content: body.content,
      important: body.important || false,
      user: user._id
    })

    const savedNote = await note.save()
    user.notes = user.notes.concat(savedNote._id)
    await user.save()

    response.status(201).json(savedNote)
  } catch (error) {
    next(error) // Pass error to middleware
  }
})

notesRouter.delete('/:id', async (request, response, next) => { // <-- Ensure 'next' is here
  try {
    // Attempt to find and delete the note.
    // If the note doesn't exist, `findByIdAndDelete` will return `null`.
    await Note.findByIdAndDelete(request.params.id)

    // According to REST best practices for idempotent DELETE operations,
    // if the request itself was valid (i.e., the ID format was correct),
    // we return 204 No Content, whether a resource was actually deleted or not.
    // The client's desired state (resource gone) is achieved.
    response.status(204).end()

  } catch (error) {
    // If there's an error (e.g., CastError for a malformed ID),
    // pass it to the error handling middleware.
    next(error)
  }
})

notesRouter.put('/:id', (request, response, next) => {
  const { content, important } = request.body

  Note.findById(request.params.id)
    .then(note => {
      if (!note) {
        return response.status(404).end()
      }

      note.content = content
      note.important = important

      return note.save().then(updatedNote => {
        response.json(updatedNote)
      })
    })
    .catch(error => next(error))
})

module.exports = notesRouter;
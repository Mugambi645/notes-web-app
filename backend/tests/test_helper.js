const Note = require('../models/note')
const User = require('../models/user') // <--- Add User import

const initialNotes = [
  {
    content: 'HTML is easy',
    important: false,
    // Note: 'user' field will be added dynamically in the test's beforeEach
  },
  {
    content: 'Browser can execute only JavaScript',
    important: true,
    // Note: 'user' field will be added dynamically in the test's beforeEach
  },
]

const nonExistingId = async () => {
  const note = new Note({ content: 'willremovethissoon', important: false }) // Add important to match schema if it's required
  await note.save()
  await note.deleteOne()

  return note._id.toString()
}

const notesInDb = async () => {
  const notes = await Note.find({}).populate('user', { username: 1, name: 1 }) // Populate user if your test expects it
  return notes.map(note => note.toJSON())
}

// <--- Add this new helper function for users
const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialNotes,
  nonExistingId,
  notesInDb,
  usersInDb, // <--- Export the new helper
}
const assert = require('node:assert')
const bcrypt = require('bcrypt') // Import bcrypt for user creation in tests
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')

const app = require('../app')
const helper = require('./test_helper')
const Note = require('../models/note') // Ensure Note model is imported
const User = require('../models/user') // Ensure User model is imported

const api = supertest(app)

describe('when there is initially some notes saved', () => {
  let testUser = null // Variable to store the created test user

  beforeEach(async () => {
    await Note.deleteMany({}) // Clear notes collection
    await User.deleteMany({}) // Clear users collection (crucial for clean state)

    // 1. Create a test user FIRST
    const passwordHash = await bcrypt.hash('secretpassword', 10)
    testUser = new User({ username: 'testuser', name: 'Test User', passwordHash })
    await testUser.save()

    // 2. Map initial notes to include the created user's ID
    const notesWithUser = helper.initialNotes.map(note => ({
      ...note,
      user: testUser._id // Link note to the created user
    }))

    // 3. Insert notes with user IDs
    await Note.insertMany(notesWithUser)
  })

  test('notes are returned as json', async () => {
    await api
      .get('/api/notes')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all notes are returned', async () => {
    const response = await api.get('/api/notes')

    assert.strictEqual(response.body.length, helper.initialNotes.length)
  })

  test('a specific note is within the returned notes', async () => {
    const response = await api.get('/api/notes')

    const contents = response.body.map(e => e.content)
    assert(contents.includes('HTML is easy'))
  })

  describe('viewing a specific note', () => {
    test('succeeds with a valid id', async () => {
      const notesAtStart = await helper.notesInDb()
      const noteToView = notesAtStart[0]

      const resultNote = await api
        .get(`/api/notes/${noteToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      // Note: Use deepStrictEqual carefully as populated fields might differ slightly in structure.
      // If `noteToView` is a plain object from toJSON() and `resultNote.body` is also from toJSON(), they should match.
      // If `resultNote.body` has populated 'user' and `noteToView` doesn't, they won't match exactly.
      // Consider asserting specific properties or using a custom comparison if exact match is problematic.
      assert.strictEqual(resultNote.body.id, noteToView.id);
      assert.strictEqual(resultNote.body.content, noteToView.content);
      assert.strictEqual(resultNote.body.important, noteToView.important);
      // If user is populated in both and you want to check it:
      assert.strictEqual(resultNote.body.user.username, testUser.username);
    })

    test('fails with statuscode 404 if note does not exist', async () => {
      const validNonexistingId = await helper.nonExistingId()

      await api.get(`/api/notes/${validNonexistingId}`).expect(404)
    })

    test('fails with statuscode 400 id is invalid', async () => {
      const invalidId = '5a3d5da59070081a82a3445' // Malformed ID

      await api.get(`/api/notes/${invalidId}`).expect(400)
    })
  })

  describe('addition of a new note', () => {
    test('succeeds with valid data', async () => {
      const newNote = {
        content: 'async/await simplifies making async calls',
        important: true,
        userId: testUser._id.toString() // <--- ADD THIS: Link the new note to the test user
      }

      await api
        .post('/api/notes')
        .send(newNote)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const notesAtEnd = await helper.notesInDb()
      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length + 1)

      const contents = notesAtEnd.map(n => n.content)
      assert(contents.includes(newNote.content))
    })

    test('fails with status code 400 if data invalid', async () => {
      const newNote = { important: true } // Missing 'content' and 'userId'

      await api.post('/api/notes').send(newNote).expect(400)

      const notesAtEnd = await helper.notesInDb()

      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length)
    })
  })

  describe('deletion of a note', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const notesAtStart = await helper.notesInDb()
      const noteToDelete = notesAtStart[0]

      await api.delete(`/api/notes/${noteToDelete.id}`).expect(204)

      const notesAtEnd = await helper.notesInDb()

      const contents = notesAtEnd.map(n => n.content)
      assert(!contents.includes(noteToDelete.content))

      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length - 1)
    })

    // Optional: Test deletion of a non-existing note (should also be 204 typically)
    test('succeeds with status code 204 if id does not exist', async () => {
        const nonExistingId = await helper.nonExistingId();
        await api.delete(`/api/notes/${nonExistingId}`).expect(204);
        // Assert that the number of notes remains unchanged
        const notesAtEnd = await helper.notesInDb();
        assert.strictEqual(notesAtEnd.length, helper.initialNotes.length);
    });

    // Optional: Test deletion with invalid ID (should be 400 if your error handler returns that)
    test('fails with status code 400 if id is invalid', async () => {
        const invalidId = 'notavalidid';
        await api.delete(`/api/notes/${invalidId}`).expect(400);
        const notesAtEnd = await helper.notesInDb();
        assert.strictEqual(notesAtEnd.length, helper.initialNotes.length);
    });
  })
})

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root', // This username already exists from beforeEach
      name: 'Superuser',
      password: 'salainen'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    // IMPORTANT: Make sure this string EXACTLY matches what your backend returns for duplicate username error
    assert(result.body.error.includes('username must be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

after(async () => {
  await mongoose.connection.close()
})
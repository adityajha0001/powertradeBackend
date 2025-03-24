import express from 'express'
import { signup, login, getUsersByCity } from './routes/auth'
import cookieParser from 'cookie-parser'

const app = express()
app.use(express.json())
app.use(cookieParser())

// Auth routes
app.post('/signup', signup)
app.post('/login', login)
app.get('/users', getUsersByCity)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
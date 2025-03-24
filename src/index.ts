import express from 'express'
import { signup, login } from './routes/auth'

const app = express()
app.use(express.json())

// Auth routes
app.post('/signup', signup)
app.post('/login', login)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
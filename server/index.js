import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import reminderRoutes from './routes/reminders.js'
import notesRoutes from './routes/notes.js'
import eventsRoutes from './routes/events.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://unventable-mikaela-photolithographic.ngrok-free.dev',
    /\.ngrok-free\.app$/,
    /\.ngrok-free\.dev$/,
  ],
  credentials: true,
}))

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LifeNotes server running' })
})

app.use('/api/reminders', reminderRoutes)
app.use('/api/notes', notesRoutes)
app.use('/api/events', eventsRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
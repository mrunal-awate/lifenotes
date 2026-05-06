import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../utils/supabaseClient.js'

const router = express.Router()

// Get all due reminders for a user right now
router.get('/due', requireAuth, async (req, res) => {
  const now = new Date()

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('is_completed', false)
    .gte('event_date', now.toISOString())

  if (error) return res.status(500).json({ error: error.message })

  const dueReminders = []

  for (const event of events) {
    const eventTime = new Date(event.event_date)
    const diffMs = eventTime - now
    const diffMins = Math.floor(diffMs / 60000)
    const reminders = event.reminder_minutes || [60]

    for (const reminderMin of reminders) {
      if (diffMins <= reminderMin && diffMins >= reminderMin - 2) {
        const label = reminderMin >= 60
          ? `${reminderMin / 60} hour${reminderMin / 60 > 1 ? 's' : ''}`
          : `${reminderMin} minutes`

        dueReminders.push({
          eventId: event.id,
          title: event.title,
          description: event.description,
          eventTime: event.event_date,
          reminderMin,
          label,
        })
      }
    }
  }

  res.json(dueReminders)
})

export default router
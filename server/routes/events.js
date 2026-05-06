import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../utils/supabaseClient.js'

const router = express.Router()

// Get all events
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', req.user.id)
    .order('event_date', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Get upcoming events within next hour
router.get('/upcoming', requireAuth, async (req, res) => {
  const now = new Date()
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('is_completed', false)
    .gte('event_date', now.toISOString())
    .lte('event_date', inOneHour.toISOString())

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Create event
router.post('/', requireAuth, async (req, res) => {
  const { title, description, category, event_date, reminder_minutes, is_recurring, recurrence_type } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required' })
  if (!event_date) return res.status(400).json({ error: 'Date is required' })

  const { data, error } = await supabase
    .from('events')
    .insert({ title, description, category, event_date, reminder_minutes, is_recurring, recurrence_type, user_id: req.user.id })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// Update event
router.put('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Delete event
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

export default router
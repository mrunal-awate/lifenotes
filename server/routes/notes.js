import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../utils/supabaseClient.js'

const router = express.Router()

// Get all notes
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', req.user.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Create note
router.post('/', requireAuth, async (req, res) => {
  const { title, content, category, priority, color, is_pinned } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required' })

  const { data, error } = await supabase
    .from('notes')
    .insert({ title, content, category, priority, color, is_pinned, user_id: req.user.id })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// Update note
router.put('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('notes')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Delete note
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

export default router
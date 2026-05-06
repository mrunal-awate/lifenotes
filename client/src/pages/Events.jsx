import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'
import { Plus, Trash2, Pencil, X, Search, CheckCircle, Clock } from 'lucide-react'
import { format, isPast, isToday, isTomorrow } from 'date-fns'

const CATEGORIES = ['general', 'work', 'meeting', 'interview', 'health', 'personal', 'finance']
const REMINDER_OPTIONS = [
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
]

const categoryColor = {
  general: 'bg-slate-500/20 text-slate-400',
  work: 'bg-blue-500/20 text-blue-400',
  meeting: 'bg-purple-500/20 text-purple-400',
  interview: 'bg-orange-500/20 text-orange-400',
  health: 'bg-green-500/20 text-green-400',
  personal: 'bg-pink-500/20 text-pink-400',
  finance: 'bg-yellow-500/20 text-yellow-400',
}

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showCompleted, setShowCompleted] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    event_date: '',
    event_time: '',
    reminder_minutes: [60],
    is_recurring: false,
    recurrence_type: 'daily',
  })

  useEffect(() => {
    if (!user) return
    const loadEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true })
      if (!error) setEvents(data)
      setLoading(false)
    }
    loadEvents()
  }, [user])

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })
    if (!error) setEvents(data)
  }

  const openCreate = () => {
    setEditEvent(null)
    setForm({
      title: '',
      description: '',
      category: 'general',
      event_date: '',
      event_time: '',
      reminder_minutes: [60],
      is_recurring: false,
      recurrence_type: 'daily',
    })
    setShowModal(true)
  }

  const openEdit = (event) => {
    const dt = new Date(event.event_date)
    setEditEvent(event)
    setForm({
      title: event.title,
      description: event.description || '',
      category: event.category,
      event_date: format(dt, 'yyyy-MM-dd'),
      event_time: format(dt, 'HH:mm'),
      reminder_minutes: event.reminder_minutes || [60],
      is_recurring: event.is_recurring,
      recurrence_type: event.recurrence_type || 'daily',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.event_date || !form.event_time) { toast.error('Date and time are required'); return }

    const event_date = new Date(`${form.event_date}T${form.event_time}`).toISOString()

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      event_date,
      reminder_minutes: form.reminder_minutes,
      is_recurring: form.is_recurring,
      recurrence_type: form.is_recurring ? form.recurrence_type : null,
    }

    if (editEvent) {
      const { error } = await supabase.from('events').update(payload).eq('id', editEvent.id)
      if (error) { toast.error('Failed to update'); return }
      toast.success('Event updated')
    } else {
      const { error } = await supabase.from('events').insert({ ...payload, user_id: user.id })
      if (error) { toast.error('Failed to create'); return }
      toast.success('Event created')
    }
    setShowModal(false)
    fetchEvents()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Event deleted')
    fetchEvents()
  }

  const handleComplete = async (event) => {
    await supabase.from('events').update({ is_completed: !event.is_completed }).eq('id', event.id)
    fetchEvents()
  }

  const toggleReminder = (value) => {
    setForm(prev => ({
      ...prev,
      reminder_minutes: prev.reminder_minutes.includes(value)
        ? prev.reminder_minutes.filter(v => v !== value)
        : [...prev.reminder_minutes, value]
    }))
  }

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr)
    if (isToday(date)) return { label: 'Today', color: 'text-green-400' }
    if (isTomorrow(date)) return { label: 'Tomorrow', color: 'text-blue-400' }
    if (isPast(date)) return { label: 'Overdue', color: 'text-red-400' }
    return { label: format(date, 'MMM d'), color: 'text-slate-400' }
  }

  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || e.category === filterCategory
    const matchCompleted = showCompleted ? true : !e.is_completed
    return matchSearch && matchCategory && matchCompleted
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Events</h2>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-slate-300 text-sm focus:outline-none">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowCompleted(!showCompleted)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${showCompleted ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#1e293b] border-slate-700 text-slate-300'}`}>
          {showCompleted ? 'Hiding Completed' : 'Show Completed'}
        </button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Clock className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <p>No events found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => {
            const { label, color } = getDateLabel(event.event_date)
            return (
              <div key={event.id}
                className={`bg-[#1e293b] rounded-2xl p-5 border transition group flex items-start gap-4
                  ${event.is_completed ? 'border-slate-800 opacity-60' : 'border-slate-700 hover:border-indigo-600'}`}>

                {/* Complete button */}
                <button onClick={() => handleComplete(event)} className="mt-0.5 flex-shrink-0">
                  <CheckCircle size={20} className={event.is_completed ? 'text-green-500' : 'text-slate-600 hover:text-green-500 transition'} />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold text-sm ${event.is_completed ? 'line-through text-slate-500' : 'text-white'}`}>
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                      <button onClick={() => openEdit(event)} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="p-1 rounded-lg hover:bg-red-900/40 text-slate-400 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-slate-400 text-xs mt-1">{event.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor[event.category]}`}>
                      {event.category}
                    </span>
                    <span className={`text-xs font-medium ${color}`}>{label}</span>
                    <span className="text-xs text-slate-500">
                      {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
                    </span>
                    {event.is_recurring && (
                      <span className="text-xs text-indigo-400">↻ {event.recurrence_type}</span>
                    )}
                    {event.reminder_minutes?.length > 0 && (
                      <span className="text-xs text-slate-500">
                        🔔 {event.reminder_minutes.length} reminder{event.reminder_minutes.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">{editEvent ? 'Edit Event' : 'New Event'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Event title"
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500" />

            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)" rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Time</label>
                <input type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-slate-700 text-slate-300 text-sm focus:outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block">Reminders</label>
              <div className="grid grid-cols-2 gap-2">
                {REMINDER_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => toggleReminder(opt.value)}
                    className={`px-3 py-2 rounded-xl text-xs border transition text-left
                      ${form.reminder_minutes.includes(opt.value)
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-[#0f172a] border-slate-700 text-slate-400 hover:border-indigo-600'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="recurring" checked={form.is_recurring}
                onChange={e => setForm({ ...form, is_recurring: e.target.checked })}
                className="accent-indigo-500" />
              <label htmlFor="recurring" className="text-sm text-slate-300">Recurring event</label>
            </div>

            {form.is_recurring && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Repeat</label>
                <select value={form.recurrence_type} onChange={e => setForm({ ...form, recurrence_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-slate-700 text-slate-300 text-sm focus:outline-none">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm transition">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
                {editEvent ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
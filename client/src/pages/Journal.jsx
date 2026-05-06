import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'
import { Plus, X, Pencil, Trash2, BookOpen } from 'lucide-react'
import { format } from 'date-fns'

const MOODS = [
  { label: 'Amazing', emoji: '🤩' },
  { label: 'Happy', emoji: '😊' },
  { label: 'Neutral', emoji: '😐' },
  { label: 'Sad', emoji: '😢' },
  { label: 'Stressed', emoji: '😤' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Grateful', emoji: '🙏' },
  { label: 'Anxious', emoji: '😰' },
]

export default function Journal() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [viewEntry, setViewEntry] = useState(null)
  const [form, setForm] = useState({
    content: '',
    mood: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    if (!user) return
    const loadEntries = async () => {
      const { data, error } = await supabase
        .from('journal')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (!error) setEntries(data)
      setLoading(false)
    }
    loadEntries()
  }, [user])

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('journal')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (!error) setEntries(data)
  }

  const openCreate = () => {
    setEditEntry(null)
    setForm({
      content: '',
      mood: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    })
    setShowModal(true)
  }

  const openEdit = (entry) => {
    setEditEntry(entry)
    setForm({
      content: entry.content,
      mood: entry.mood || '',
      date: entry.date,
    })
    setViewEntry(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.content.trim()) { toast.error('Write something first'); return }

    const payload = {
      content: form.content,
      mood: form.mood,
      date: form.date,
    }

    if (editEntry) {
      const { error } = await supabase.from('journal').update(payload).eq('id', editEntry.id)
      if (error) { toast.error('Failed to update'); return }
      toast.success('Entry updated')
    } else {
      const { error } = await supabase.from('journal').insert({ ...payload, user_id: user.id })
      if (error) { toast.error('Failed to save'); return }
      toast.success('Entry saved')
    }
    setShowModal(false)
    fetchEntries()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    const { error } = await supabase.from('journal').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Entry deleted')
    setViewEntry(null)
    fetchEntries()
  }

  const getMoodEmoji = (label) => {
    return MOODS.find(m => m.label === label)?.emoji || '📝'
  }

  // Group entries by month
  const grouped = entries.reduce((acc, entry) => {
    const month = format(new Date(entry.date), 'MMMM yyyy')
    if (!acc[month]) acc[month] = []
    acc[month].push(entry)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Journal</h2>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> New Entry
        </button>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <BookOpen className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <p>No journal entries yet</p>
          <p className="text-sm mt-1">Start writing your first entry</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, monthEntries]) => (
            <div key={month}>
              <h3 className="text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                {month}
              </h3>
              <div className="space-y-3">
                {monthEntries.map(entry => (
                  <div key={entry.id}
                    onClick={() => setViewEntry(entry)}
                    className="bg-[#1e293b] rounded-2xl p-5 border border-slate-700 hover:border-indigo-600 transition cursor-pointer group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {format(new Date(entry.date), 'EEEE, MMMM d')}
                          </p>
                          {entry.mood && (
                            <p className="text-slate-500 text-xs">{entry.mood}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(entry) }}
                          className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white">
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id) }}
                          className="p-1 rounded-lg hover:bg-red-900/40 text-slate-400 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm mt-3 line-clamp-2 leading-relaxed">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Entry Modal */}
      {viewEntry && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getMoodEmoji(viewEntry.mood)}</span>
                <div>
                  <p className="text-white font-semibold">
                    {format(new Date(viewEntry.date), 'EEEE, MMMM d yyyy')}
                  </p>
                  {viewEntry.mood && (
                    <p className="text-slate-400 text-sm">{viewEntry.mood}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setViewEntry(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {viewEntry.content}
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => openEdit(viewEntry)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm transition flex items-center justify-center gap-2">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => handleDelete(viewEntry.id)}
                className="flex-1 py-2.5 rounded-xl border border-red-800 text-red-400 hover:bg-red-900/30 text-sm transition flex items-center justify-center gap-2">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">
                {editEntry ? 'Edit Entry' : 'New Journal Entry'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date</label>
              <input type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block">How are you feeling?</label>
              <div className="grid grid-cols-4 gap-2">
                {MOODS.map(mood => (
                  <button key={mood.label} onClick={() => setForm({ ...form, mood: mood.label })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition
                      ${form.mood === mood.label
                        ? 'border-indigo-500 bg-indigo-600/20 text-white'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                    <span className="text-xl">{mood.emoji}</span>
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Write your thoughts</label>
              <textarea value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="What's on your mind today..."
                rows={7}
                className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none leading-relaxed" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm transition">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
                {editEntry ? 'Update' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
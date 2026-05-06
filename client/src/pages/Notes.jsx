import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'
import { Plus, Pin, Trash2, Pencil, X, Search } from 'lucide-react'

const CATEGORIES = ['general', 'work', 'personal', 'interview', 'health', 'finance', 'ideas']
const PRIORITIES = ['low', 'medium', 'high']
const COLORS = ['#1e293b', '#1e3a5f', '#1a3a2a', '#3b1f2b', '#2d2640', '#2a2a1e']

const priorityColor = {
  high: 'bg-red-500/20 text-red-400 border-red-800',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-800',
  low: 'bg-green-500/20 text-green-400 border-green-800',
}

export default function Notes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editNote, setEditNote] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    color: '#1e293b',
    is_pinned: false,
  })

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error) setNotes(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    const loadNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (!error) setNotes(data)
      setLoading(false)
    }
    loadNotes()
  }, [user])

  const openCreate = () => {
    setEditNote(null)
    setForm({ title: '', content: '', category: 'general', priority: 'medium', color: '#1e293b', is_pinned: false })
    setShowModal(true)
  }

  const openEdit = (note) => {
    setEditNote(note)
    setForm({ title: note.title, content: note.content, category: note.category, priority: note.priority, color: note.color, is_pinned: note.is_pinned })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (editNote) {
      const { error } = await supabase.from('notes').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editNote.id)
      if (error) { toast.error('Failed to update'); return }
      toast.success('Note updated')
    } else {
      const { error } = await supabase.from('notes').insert({ ...form, user_id: user.id })
      if (error) { toast.error('Failed to create'); return }
      toast.success('Note created')
    }
    setShowModal(false)
    fetchNotes()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Note deleted')
    fetchNotes()
  }

  const handlePin = async (note) => {
    await supabase.from('notes').update({ is_pinned: !note.is_pinned }).eq('id', note.id)
    fetchNotes()
  }

  const filtered = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || n.category === filterCategory
    const matchPriority = filterPriority === 'all' || n.priority === filterPriority
    return matchSearch && matchCategory && matchPriority
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Notes</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> New Note
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-slate-300 text-sm focus:outline-none">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#1e293b] border border-slate-700 text-slate-300 text-sm focus:outline-none">
          <option value="all">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <StickyNoteIcon />
          <p className="mt-3">No notes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(note => (
            <div key={note.id} style={{ backgroundColor: note.color }}
              className="rounded-2xl p-5 border border-slate-700 flex flex-col gap-3 hover:border-indigo-600 transition group">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-white font-semibold text-sm flex-1 leading-snug">{note.title}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => handlePin(note)} className={`p-1 rounded-lg hover:bg-slate-700 ${note.is_pinned ? 'text-yellow-400' : 'text-slate-400'}`}>
                    <Pin size={14} />
                  </button>
                  <button onClick={() => openEdit(note)} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(note.id)} className="p-1 rounded-lg hover:bg-red-900/40 text-slate-400 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{note.content}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-slate-500 capitalize">{note.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${priorityColor[note.priority]}`}>
                  {note.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">{editNote ? 'Edit Note' : 'New Note'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />

            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Write your note here..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-slate-700 text-slate-300 text-sm focus:outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-slate-700 text-slate-300 text-sm focus:outline-none">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block">Card Color</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full border-2 transition ${form.color === c ? 'border-indigo-400' : 'border-slate-600'}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="pin" checked={form.is_pinned}
                onChange={e => setForm({ ...form, is_pinned: e.target.checked })}
                className="accent-indigo-500" />
              <label htmlFor="pin" className="text-sm text-slate-300">Pin this note</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm transition">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition">
                {editNote ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StickyNoteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
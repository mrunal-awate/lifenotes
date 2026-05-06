import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/useAuth'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { CalendarClock, StickyNote, BookOpen, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ notes: 0, events: 0, journal: 0 })
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [overdueEvents, setOverdueEvents] = useState([])
  const [pinnedNotes, setPinnedNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      const now = new Date().toISOString()

      const [notesRes, eventsRes, journalRes, upcomingRes, overdueRes, pinnedRes] =
        await Promise.all([
          supabase.from('notes').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('events').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_completed', false),
          supabase.from('journal').select('id', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('events').select('*').eq('user_id', user.id).eq('is_completed', false).gte('event_date', now).order('event_date').limit(5),
          supabase.from('events').select('*').eq('user_id', user.id).eq('is_completed', false).lt('event_date', now).order('event_date').limit(3),
          supabase.from('notes').select('*').eq('user_id', user.id).eq('is_pinned', true).limit(4),
        ])

      setStats({
        notes: notesRes.count || 0,
        events: eventsRes.count || 0,
        journal: journalRes.count || 0,
      })
      setUpcomingEvents(upcomingRes.data || [])
      setOverdueEvents(overdueRes.data || [])
      setPinnedNotes(pinnedRes.data || [])
      setLoading(false)
    }

    if (user) fetchDashboardData()
  }, [user])

  const getEventLabel = (dateStr) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  const priorityColor = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Notes', value: stats.notes, icon: StickyNote, color: 'bg-indigo-600', to: '/notes' },
          { label: 'Upcoming Events', value: stats.events, icon: CalendarClock, color: 'bg-purple-600', to: '/events' },
          { label: 'Journal Entries', value: stats.journal, icon: BookOpen, color: 'bg-teal-600', to: '/journal' },
        ].map(({ label, value, icon: Icon, color, to }) => (
          <Link to={to} key={label}>
            <div className="bg-[#1e293b] rounded-2xl p-5 flex items-center gap-4 hover:bg-[#273548] transition">
              <div className={`${color} p-3 rounded-xl`}>
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-slate-400">{label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Overdue Events */}
      {overdueEvents.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-red-400" />
            <h3 className="text-red-400 font-semibold">Overdue Events</h3>
          </div>
          <div className="space-y-2">
            {overdueEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between">
                <span className="text-white text-sm">{event.title}</span>
                <span className="text-red-400 text-xs">{format(new Date(event.event_date), 'MMM d, h:mm a')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-[#1e293b] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Upcoming Events</h3>
            <Link to="/events" className="text-indigo-400 text-sm hover:underline">View all</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-slate-500 text-sm">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{event.title}</p>
                    <p className="text-slate-400 text-xs">{event.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-400 text-xs font-medium">{getEventLabel(event.event_date)}</p>
                    <p className="text-slate-400 text-xs">{format(new Date(event.event_date), 'h:mm a')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pinned Notes */}
        <div className="bg-[#1e293b] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Pinned Notes</h3>
            <Link to="/notes" className="text-indigo-400 text-sm hover:underline">View all</Link>
          </div>
          {pinnedNotes.length === 0 ? (
            <p className="text-slate-500 text-sm">No pinned notes</p>
          ) : (
            <div className="space-y-3">
              {pinnedNotes.map(note => (
                <div key={note.id} className="py-2 border-b border-slate-700 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-medium">{note.title}</p>
                    <span className={`text-xs font-medium ${priorityColor[note.priority]}`}>
                      {note.priority}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1 truncate">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
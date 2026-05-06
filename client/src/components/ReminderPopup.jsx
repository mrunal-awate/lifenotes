import { useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/useAuth'
import { format } from 'date-fns'
import { X, Bell } from 'lucide-react'

export default function ReminderPopup() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const firedRef = useRef(new Set())

  useEffect(() => {
    if (!user) return

    const checkAlerts = async () => {
      const now = new Date()

      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .gte('event_date', now.toISOString())

      if (!events) return

      const newAlerts = []

      for (const event of events) {
        const eventTime = new Date(event.event_date)
        const diffMs = eventTime - now
        const diffMins = Math.floor(diffMs / 60000)
        const reminders = event.reminder_minutes || [60]

        for (const reminderMin of reminders) {
          const key = `popup-${event.id}-${reminderMin}`
          if (firedRef.current.has(key)) continue

          if (diffMins <= reminderMin && diffMins >= reminderMin - 1) {
            firedRef.current.add(key)
            const label = reminderMin >= 60
              ? `${reminderMin / 60} hour${reminderMin / 60 > 1 ? 's' : ''}`
              : `${reminderMin} minutes`
            newAlerts.push({
              id: key,
              title: event.title,
              time: format(eventTime, 'h:mm a'),
              label,
            })
          }
        }
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev, ...newAlerts])
      }
    }

    checkAlerts()
    const interval = setInterval(checkAlerts, 60000)
    return () => clearInterval(interval)
  }, [user])

  const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id))

  if (alerts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {alerts.map(alert => (
        <div key={alert.id}
          className="bg-[#1e293b] border border-indigo-600 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl flex-shrink-0">
            <Bell size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">⏰ {alert.title}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Starting in {alert.label} • {alert.time}
            </p>
          </div>
          <button onClick={() => dismiss(alert.id)} className="text-slate-400 hover:text-white flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
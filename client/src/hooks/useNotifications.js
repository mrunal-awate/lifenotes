import { useEffect, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/useAuth'

export const useNotifications = () => {
  const { user } = useAuth()
  const swRef = useRef(null)
  const firedRef = useRef(new Set())

  useEffect(() => {
    if (!user) return

    const registerSW = async () => {
      if (!('serviceWorker' in navigator)) return
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        swRef.current = reg
      } catch (err) {
        console.error('SW registration failed:', err)
      }
    }

    const requestPermission = async () => {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    }

    registerSW()
    requestPermission()
  }, [user])

  useEffect(() => {
    if (!user) return

    const checkReminders = async () => {
      if (Notification.permission !== 'granted') return

      const now = new Date()

      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .gte('event_date', now.toISOString())

      if (error || !events) return

      for (const event of events) {
        const eventTime = new Date(event.event_date)
        const diffMs = eventTime - now
        const diffMins = Math.floor(diffMs / 60000)

        const reminders = event.reminder_minutes || [60]

        for (const reminderMin of reminders) {
          const key = `${event.id}-${reminderMin}`

          if (firedRef.current.has(key)) continue

          if (diffMins <= reminderMin && diffMins >= reminderMin - 1) {
            firedRef.current.add(key)

            const label = reminderMin >= 60
              ? `${reminderMin / 60} hour${reminderMin / 60 > 1 ? 's' : ''}`
              : `${reminderMin} minutes`

            const message = {
              type: 'SHOW_NOTIFICATION',
              title: `⏰ Reminder: ${event.title}`,
              body: `Starting in ${label}${event.description ? ' — ' + event.description : ''}`,
              tag: key,
            }

            if (swRef.current?.active) {
              swRef.current.active.postMessage(message)
            } else {
              new Notification(message.title, { body: message.body })
            }
          }
        }
      }
    }

    checkReminders()
    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [user])
}
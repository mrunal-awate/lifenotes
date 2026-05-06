import { Menu, Bell } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { format } from 'date-fns'

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth()
  const [upcomingCount, setUpcomingCount] = useState(0)

  useEffect(() => {
    const fetchUpcoming = async () => {
      const now = new Date()
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
      const { data } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .gte('event_date', now.toISOString())
        .lte('event_date', inOneHour.toISOString())
      setUpcomingCount(data?.length || 0)
    }

    if (user) fetchUpcoming()
  }, [user])

  return (
    <header className="h-16 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-400 hover:text-white"
        >
          <Menu size={22} />
        </button>
        <div>
          <p className="text-sm text-slate-400">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <Bell size={20} className="text-slate-400 hover:text-white cursor-pointer" />
          {upcomingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {upcomingCount}
            </span>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.email?.[0].toUpperCase()}
          </div>
          <span className="hidden md:block text-sm text-slate-300 max-w-[150px] truncate">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  )
}
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  StickyNote,
  CalendarClock,
  BookOpen,
  LogOut,
  X
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/notes', icon: StickyNote, label: 'Notes' },
  { to: '/events', icon: CalendarClock, label: 'Events' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-[#1e293b] flex flex-col
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h1 className="text-xl font-bold text-indigo-400">LifeNotes</h1>
            <p className="text-xs text-slate-500 mt-0.5">Your personal organizer</p>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all text-sm font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
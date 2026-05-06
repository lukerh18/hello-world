import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import {
  Bars3Icon,
  ChartBarIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'

interface TopNavProps {
  onOpenSettings: () => void
}

const navItems = [
  { label: 'Progress', icon: ChartBarIcon, to: '/progress' },
  { label: 'Health AI', icon: HeartIcon, to: '/health' },
  { label: 'Program', icon: ClipboardDocumentListIcon, to: '/program' },
]

export function TopNav({ onOpenSettings }: TopNavProps) {
  const [open, setOpen] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div className="relative flex justify-end px-4 safe-top pt-1 pb-1" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-xl bg-surface-800 text-text-muted hover:text-text-primary transition-colors"
        aria-label="Open menu"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute top-full right-4 mt-1 w-52 bg-surface-800 border border-surface-600 rounded-2xl shadow-xl overflow-hidden z-50">
          {navItems.map(({ label, icon: Icon, to }) => (
            <button
              key={to}
              onClick={() => { navigate(to); setOpen(false) }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-text-secondary hover:bg-surface-700 transition-colors text-left"
            >
              <Icon className="w-4 h-4 text-text-muted shrink-0" />
              {label}
            </button>
          ))}

          <div className="border-t border-surface-600 mx-2" />

          <button
            onClick={() => { onOpenSettings(); setOpen(false) }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-text-secondary hover:bg-surface-700 transition-colors text-left"
          >
            <Cog6ToothIcon className="w-4 h-4 text-text-muted shrink-0" />
            Settings
          </button>

          <button
            onClick={() => { signOut(); setOpen(false) }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-danger hover:bg-surface-700 transition-colors text-left"
          >
            <ArrowRightStartOnRectangleIcon className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

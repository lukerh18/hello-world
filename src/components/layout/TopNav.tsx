import { NavLink } from 'react-router-dom'

const links = [
  { to: '/progress', label: 'Progress' },
  { to: '/health',   label: 'Health AI' },
  { to: '/program',  label: 'Program'  },
]

export function TopNav() {
  return (
    <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto scrollbar-none">
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              isActive
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-surface-800 border-surface-600 text-slate-500 hover:text-slate-300'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  )
}

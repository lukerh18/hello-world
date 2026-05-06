import { NavLink, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  BoltIcon,
  FireIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolid,
  BoltIcon as BoltSolid,
  FireIcon as FireSolid,
  ChartBarIcon as ChartBarSolid,
} from '@heroicons/react/24/solid'

const tabs = [
  { to: '/',             label: 'Today',    Icon: HomeIcon,     IconActive: HomeSolid,     exact: true  },
  { to: '/nutrition',    label: 'Fuel',     Icon: FireIcon,     IconActive: FireSolid,     exact: false },
  { to: '/workout',      label: 'Workout',  Icon: BoltIcon,     IconActive: BoltSolid,     exact: false },
  { to: '/progress',     label: 'Progress', Icon: ChartBarIcon, IconActive: ChartBarSolid, exact: false },
]

export function BottomNav() {
  const location = useLocation()

  function isActive(tab: typeof tabs[number]) {
    if (tab.exact) return location.pathname === '/'
    return location.pathname.startsWith(tab.to)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-800/95 backdrop-blur border-t border-surface-600 safe-bottom safe-x z-40">
      <div className="flex items-end justify-around h-16 px-2 pb-1.5">
        {tabs.map((tab) => {
          const active = isActive(tab)
          const Icon = active ? tab.IconActive : tab.Icon
          return (
            <NavLink
              key={tab.label}
              to={tab.to}
              aria-label={tab.label}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
            >
              <Icon className={`w-5 h-5 transition-colors ${active ? 'text-accent' : 'text-text-muted'}`} />
              <span className={`text-[10px] font-medium tracking-wide transition-colors ${active ? 'text-accent' : 'text-text-muted'}`}>
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

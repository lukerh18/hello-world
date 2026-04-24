import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  BoltIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  BoltIcon as BoltIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  TrophyIcon as TrophyIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
} from '@heroicons/react/24/solid'

const tabs = [
  { to: '/', label: 'Today', Icon: HomeIcon, IconActive: HomeIconSolid },
  { to: '/workout', label: 'Workout', Icon: BoltIcon, IconActive: BoltIconSolid },
  { to: '/nutrition', label: 'Nutrition', Icon: ChartBarIcon, IconActive: ChartBarIconSolid },
  { to: '/progress', label: 'Progress', Icon: TrophyIcon, IconActive: TrophyIconSolid },
  { to: '/program', label: 'Program', Icon: CalendarDaysIcon, IconActive: CalendarDaysIconSolid },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-800 border-t border-surface-700 safe-bottom z-40">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ to, label, Icon, IconActive }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                isActive ? 'text-accent' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) =>
              isActive ? (
                <>
                  <IconActive className="w-6 h-6" />
                  <span className="text-[10px] font-semibold">{label}</span>
                </>
              ) : (
                <>
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

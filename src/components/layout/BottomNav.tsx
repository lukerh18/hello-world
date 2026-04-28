import { NavLink, useLocation } from 'react-router-dom'
import {
  Squares2X2Icon,
  SparklesIcon,
  HeartIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import {
  Squares2X2Icon as Squares2X2Solid,
  SparklesIcon as SparklesSolid,
  HeartIcon as HeartSolid,
  BoltIcon as BoltSolid,
} from '@heroicons/react/24/solid'

const tabs = [
  { to: '/',               label: 'Overview', Icon: Squares2X2Icon, IconActive: Squares2X2Solid, exact: true  },
  { to: '/life?tab=spirit',label: 'Spirit',   Icon: SparklesIcon,   IconActive: SparklesSolid,  exact: false },
  { to: '/life?tab=soul',  label: 'Soul',     Icon: HeartIcon,      IconActive: HeartSolid,     exact: false },
  { to: '/body',           label: 'Body',     Icon: BoltIcon,       IconActive: BoltSolid,      exact: false },
]

export function BottomNav() {
  const location = useLocation()

  function isActive(tab: typeof tabs[number]) {
    if (tab.exact) return location.pathname === '/'
    if (tab.to === '/life?tab=spirit') return location.pathname === '/life' && location.search.includes('spirit')
    if (tab.to === '/life?tab=soul')   return location.pathname === '/life' && location.search.includes('soul')
    return location.pathname.startsWith(tab.to.split('?')[0])
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-800/95 backdrop-blur border-t border-surface-600 safe-bottom z-40">
      <div className="flex items-center justify-around h-16 px-2">
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
              <Icon className={`w-5 h-5 transition-colors ${active ? 'text-accent' : 'text-slate-600'}`} />
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-accent' : 'text-slate-600'}`}>
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

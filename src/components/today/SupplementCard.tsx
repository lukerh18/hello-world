import { useNavigate } from 'react-router-dom'
import { BeakerIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { useSupplements } from '../../hooks/useSupplements'
import { SUPPLEMENTS, SUPPLEMENT_WINDOWS } from '../../data/supplements'

interface Props {
  date: string
}

export function SupplementCard({ date }: Props) {
  const navigate = useNavigate()
  const { isComplete, toggleWindow, completedWindows, nextDueWindow } = useSupplements(date)

  const activeWin = nextDueWindow
    ? SUPPLEMENT_WINDOWS.find((w) => w.id === nextDueWindow)
    : null
  const activeItems = activeWin
    ? SUPPLEMENTS.filter((s) => s.timeBlock === activeWin.id)
    : []

  const allDone = completedWindows.length === SUPPLEMENT_WINDOWS.length

  return (
    <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <BeakerIcon className="w-3.5 h-3.5 text-accent" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">Supplements</p>
        </div>
        <button
          onClick={() => navigate('/supplements')}
          className="text-xs text-accent font-semibold"
        >
          View all →
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {SUPPLEMENT_WINDOWS.map((w) => (
          <div
            key={w.id}
            className={`h-1.5 flex-1 rounded-full transition-all ${isComplete(w.id) ? 'bg-accent' : 'bg-surface-600'}`}
          />
        ))}
        <span className="text-[10px] text-slate-500 ml-1 tabular-nums whitespace-nowrap">
          {completedWindows.length}/{SUPPLEMENT_WINDOWS.length}
        </span>
      </div>

      {allDone ? (
        <p className="text-xs text-success">All windows complete for today</p>
      ) : activeWin ? (
        <div className="flex items-start justify-between gap-2 pt-0.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200">
              {activeWin.label}
              <span className="text-slate-600 font-normal ml-1.5">{activeWin.timeHint}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
              {activeItems.map((s) => s.name).join(' · ')}
            </p>
          </div>
          <button
            onClick={() => toggleWindow(activeWin.id)}
            className="shrink-0 transition-transform active:scale-90 mt-0.5"
            aria-label="Mark done"
          >
            {isComplete(activeWin.id)
              ? <CheckCircleSolid className="w-5 h-5 text-accent" />
              : <CheckCircleIcon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-600">No active window right now</p>
      )}
    </div>
  )
}

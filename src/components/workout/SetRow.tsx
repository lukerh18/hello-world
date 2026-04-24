import type { SetLog } from '../../types'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon as CheckCircleOutline } from '@heroicons/react/24/outline'

interface SetRowProps {
  set: SetLog
  isTimeSet?: boolean
  onChange: (updated: SetLog) => void
  onComplete: () => void
}

export function SetRow({ set, isTimeSet = false, onChange, onComplete }: SetRowProps) {
  return (
    <div
      className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${
        set.completed ? 'bg-success/10' : 'bg-surface-700'
      }`}
    >
      <span className="text-xs font-bold text-slate-500 w-5 text-center">{set.setNumber}</span>

      {!isTimeSet && (
        <div className="flex items-center gap-1 flex-1">
          <input
            type="number"
            value={set.weight || ''}
            onChange={(e) => onChange({ ...set, weight: parseFloat(e.target.value) || 0 })}
            placeholder="lbs"
            min={0}
            step={2.5}
            className="w-16 bg-surface-800 border border-surface-600 rounded-lg px-2 py-1.5 text-sm text-center text-slate-100 focus:outline-none focus:border-accent"
          />
          <span className="text-xs text-slate-500">×</span>
          <input
            type="number"
            value={set.reps || ''}
            onChange={(e) => onChange({ ...set, reps: parseInt(e.target.value) || 0 })}
            placeholder="reps"
            min={0}
            className="w-14 bg-surface-800 border border-surface-600 rounded-lg px-2 py-1.5 text-sm text-center text-slate-100 focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {isTimeSet && (
        <div className="flex-1 text-sm text-slate-400 px-1">
          {set.reps} {set.reps === 1 ? 'min' : set.weight > 60 ? 'sec' : 'min'}
        </div>
      )}

      <button
        onClick={onComplete}
        className={`flex-shrink-0 transition-colors ${
          set.completed ? 'text-success' : 'text-slate-600 hover:text-slate-400'
        }`}
      >
        {set.completed ? (
          <CheckCircleIcon className="w-6 h-6" />
        ) : (
          <CheckCircleOutline className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}

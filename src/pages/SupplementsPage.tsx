import { SUPPLEMENTS, SUPPLEMENT_WINDOWS } from '../data/supplements'
import { useSupplements } from '../hooks/useSupplements'
import { BeakerIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

export default function SupplementsPage() {
  const today = new Date().toISOString().split('T')[0]
  const { isComplete, toggleWindow, completedWindows } = useSupplements(today)

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <BeakerIcon className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-bold text-slate-100">Supplements</h1>
        </div>
        <span className="text-xs text-slate-500 tabular-nums">
          {completedWindows.length} / {SUPPLEMENT_WINDOWS.length} windows
        </span>
      </div>

      {SUPPLEMENT_WINDOWS.map((win) => {
        const done = isComplete(win.id)
        const items = SUPPLEMENTS.filter((s) => s.timeBlock === win.id)

        return (
          <div
            key={win.id}
            className={`bg-surface-800 rounded-2xl px-4 py-3 space-y-2 transition-opacity ${done ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                  {win.label}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">{win.timeHint}</p>
              </div>
              <button
                onClick={() => toggleWindow(win.id)}
                className="shrink-0 ml-2 transition-transform active:scale-90"
                aria-label={done ? 'Mark incomplete' : 'Mark done'}
              >
                {done
                  ? <CheckCircleSolid className="w-6 h-6 text-accent" />
                  : <CheckCircleIcon className="w-6 h-6 text-slate-600" />}
              </button>
            </div>

            <div className="space-y-1.5 pt-0.5">
              {items.map((s) => (
                <div key={s.id} className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${done ? 'bg-slate-600' : 'bg-accent/60'}`} />
                  <div className="min-w-0">
                    <span className={`text-xs ${done ? 'text-slate-600' : 'text-slate-300'}`}>
                      {s.name}
                      <span className="text-slate-600 ml-1">— {s.dose}</span>
                    </span>
                    {s.note && (
                      <p className="text-[10px] text-slate-600 leading-tight mt-0.5">{s.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

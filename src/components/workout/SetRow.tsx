import { useState, useEffect, useRef } from 'react'
import type { SetLog } from '../../types'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { playWorkoutTimerChime } from '../../utils/restTimerSounds'

interface SetRowProps {
  set: SetLog
  isTimeSet?: boolean
  planMode?: boolean
  /** Live rest countdown for this row when set.completed is true (`startedAt` changes each rest) */
  activeRest?: { seconds: number; cue?: string; startedAt: number } | null
  weightStep?: number
  repsStep?: number
  onChange: (updated: SetLog) => void
  onComplete: () => void
  onUndo?: () => void
  /** Fires once when the wall-clock rest interval hits zero */
  onRestFinished?: () => void
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`
}

export function SetRow({
  set,
  isTimeSet = false,
  planMode = false,
  activeRest,
  weightStep = 2.5,
  repsStep = 1,
  onChange,
  onComplete,
  onUndo,
  onRestFinished,
}: SetRowProps) {
  const [displayRemaining, setDisplayRemaining] = useState(0)
  const endAtRef = useRef<number | null>(null)
  const firedRef = useRef(false)
  const onRestFinishedRef = useRef(onRestFinished)
  onRestFinishedRef.current = onRestFinished

  useEffect(() => {
    firedRef.current = false
    if (!activeRest || !set.completed) {
      endAtRef.current = null
      setDisplayRemaining(0)
      return
    }
    endAtRef.current = Date.now() + activeRest.seconds * 1000

    const tick = () => {
      const end = endAtRef.current
      if (!end) return
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setDisplayRemaining(left)

      if (left <= 0 && !firedRef.current) {
        firedRef.current = true
        playWorkoutTimerChime(0.22)
        endAtRef.current = null
        onRestFinishedRef.current?.()
      }
    }

    tick()
    const id = window.setInterval(tick, 250)

    const onVis = () => tick()
    document.addEventListener('visibilitychange', onVis)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [activeRest?.startedAt, activeRest?.seconds, set.completed])

  const pct = activeRest && displayRemaining > 0 ? (displayRemaining / activeRest.seconds) * 100 : 0

  const bumpWeight = (delta: number) => {
    const base = typeof set.weight === 'number' && !Number.isNaN(set.weight) ? set.weight : 0
    const next = Math.max(0, Math.round((base + delta) * 100) / 100)
    onChange({ ...set, weight: next })
  }

  const bumpReps = (delta: number) => {
    const base = typeof set.reps === 'number' && !Number.isNaN(set.reps) ? set.reps : 0
    const next = Math.max(0, Math.floor(base + delta))
    onChange({ ...set, reps: next })
  }

  if (planMode) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${set.completed ? 'bg-success/10' : 'bg-surface-700'}`}>
        <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${set.completed ? 'text-success' : 'text-slate-500'}`}>
          {set.completed ? '✓' : set.setNumber}
        </span>
        <p className={`flex-1 text-sm ${set.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
          {isTimeSet
            ? `${set.reps} ${set.weight > 60 ? 'sec' : 'min'}`
            : `${set.weight || '—'} lbs × ${set.reps || '—'} reps`}
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl overflow-hidden transition-colors ${set.completed ? 'bg-success/10' : 'bg-surface-700'}`}>

      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${set.completed ? 'text-success' : 'text-slate-500'}`}>
          {set.completed ? '✓' : set.setNumber}
        </span>

        {set.completed ? (
          <p className="flex-1 text-sm text-slate-400">
            {isTimeSet
              ? `${set.reps} ${set.weight > 60 ? 'sec' : 'min'}`
              : `${set.weight || '—'} lbs × ${set.reps || '—'} reps`}
          </p>
        ) : (
          <>
            {!isTimeSet && (
              <>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    aria-label={`Increase weight by ${weightStep}`}
                    onClick={() => bumpWeight(weightStep)}
                    className="p-0.5 rounded-lg text-slate-500 hover:text-accent hover:bg-surface-800"
                  >
                    <ChevronUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Decrease weight by ${weightStep}`}
                    onClick={() => bumpWeight(-weightStep)}
                    className="p-0.5 rounded-lg text-slate-500 hover:text-accent hover:bg-surface-800"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  enterKeyHint="done"
                  value={set.weight || ''}
                  onChange={(e) => onChange({ ...set, weight: parseFloat(e.target.value) || 0 })}
                  placeholder="lbs"
                  min={0}
                  step={weightStep}
                  className="w-16 bg-surface-800 border border-surface-600 rounded-lg px-2 py-1.5 text-sm text-center text-slate-100 focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-slate-500">×</span>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  enterKeyHint="done"
                  value={set.reps || ''}
                  onChange={(e) => onChange({ ...set, reps: parseInt(e.target.value, 10) || 0 })}
                  placeholder="reps"
                  min={0}
                  className="w-14 bg-surface-800 border border-surface-600 rounded-lg px-2 py-1.5 text-sm text-center text-slate-100 focus:outline-none focus:border-accent"
                />
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    aria-label={`Increase reps by ${repsStep}`}
                    onClick={() => bumpReps(repsStep)}
                    className="p-0.5 rounded-lg text-slate-500 hover:text-accent hover:bg-surface-800"
                  >
                    <ChevronUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Decrease reps by ${repsStep}`}
                    onClick={() => bumpReps(-repsStep)}
                    className="p-0.5 rounded-lg text-slate-500 hover:text-accent hover:bg-surface-800"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
            {isTimeSet && (
              <p className="flex-1 text-sm text-slate-400 px-1">
                {set.reps} {set.weight > 60 ? 'sec' : 'min'}
              </p>
            )}
          </>
        )}
      </div>

      <div className="px-3 pb-3">
        {!set.completed ? (
          <button
            onClick={onComplete}
            className="w-full py-3 rounded-xl bg-accent text-white text-sm font-bold tracking-wide active:scale-[0.98] transition-transform select-none"
          >
            Complete Set {set.setNumber}
          </button>
        ) : activeRest && displayRemaining > 0 ? (
          <div className="space-y-2 pt-1">
            {activeRest.cue ? (
              <p className="text-xs font-semibold text-accent text-center">{activeRest.cue}</p>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-200 ease-linear"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm font-mono font-bold text-accent tabular-nums w-10 text-right">
                {fmt(displayRemaining)}
              </span>
              <button
                type="button"
                onClick={onUndo}
                className="text-xs text-slate-500 hover:text-slate-300 select-none"
              >
                Undo
              </button>
            </div>
          </div>
        ) : null}
      </div>

    </div>
  )
}

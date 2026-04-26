import { useState } from 'react'
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar'
import type { WorkoutDay } from '../../types'

interface CalendarWidgetProps {
  clientId: string
  todayWorkout: WorkoutDay | null
  currentWeek: number
}

export function CalendarWidget({ clientId, todayWorkout, currentWeek }: CalendarWidgetProps) {
  const { isConnected, connect, getFreeSlots, addWorkoutEvent, loading, error } = useGoogleCalendar(clientId)
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  if (!clientId) return null

  const slots = isConnected ? getFreeSlots() : []
  const nextSlot = slots[0] ?? null

  const handleAdd = async () => {
    if (!todayWorkout || !nextSlot) return
    setAdding(true)
    const description = todayWorkout.exercises
      .map((ex) => `• ${ex.name} — ${ex.sets} sets × ${ex.reps} reps`)
      .join('\n')
    const ok = await addWorkoutEvent(
      `${todayWorkout.name} – Week ${currentWeek}`,
      description,
      nextSlot
    )
    setAdding(false)
    if (ok) setAdded(true)
  }

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface-800 rounded-2xl border border-surface-700 hover:border-blue-400/40 transition-colors"
      >
        <CalendarIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <div className="text-left">
          <p className="text-sm font-semibold text-slate-200">Connect Google Calendar</p>
          <p className="text-xs text-slate-500">Find the best time to work out today</p>
        </div>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="px-4 py-3 bg-surface-800 rounded-2xl border border-surface-700">
        <p className="text-sm text-slate-400 animate-pulse">Checking your calendar...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-3 bg-surface-800 rounded-2xl border border-danger/30">
        <p className="text-xs text-danger">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-surface-800 rounded-2xl border border-blue-400/20 px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-slate-200">Calendar</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-success">
          <CheckCircleIcon className="w-3.5 h-3.5" />
          Connected
        </span>
      </div>

      {nextSlot ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Next free slot</p>
            <p className="text-sm font-semibold text-slate-100">{nextSlot.label}</p>
          </div>
          {todayWorkout && (
            <button
              onClick={handleAdd}
              disabled={adding || added}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                added
                  ? 'bg-success/20 text-success'
                  : 'bg-blue-400/20 text-blue-400 hover:bg-blue-400/30'
              }`}
            >
              {added ? (
                <>
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Added
                </>
              ) : (
                <>
                  <PlusIcon className="w-3.5 h-3.5" />
                  {adding ? 'Adding...' : 'Add to Calendar'}
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No free 55-min slots found between 8 AM – 12 PM today.</p>
      )}
    </div>
  )
}

import { useState } from 'react'
import {
  CalendarIcon,
  PlusIcon,
  BoltIcon,
  UserGroupIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { useGoogleCalendar, categorizeEvent } from '../../hooks/useGoogleCalendar'
import type { WorkoutDay } from '../../types'

const FAMILY_ACTIVITY_IDEAS = [
  '🚴 Bike ride with the kids',
  '⚽ Backyard soccer or catch',
  '🏊 Pool swim',
  '🛹 Skatepark or scooters',
  '🥾 Short neighborhood hike',
  '🏀 Driveway basketball',
]

const CATEGORY_ICON = {
  physical: <BoltIcon className="w-3.5 h-3.5 text-accent flex-shrink-0" />,
  family: <UserGroupIcon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />,
  work: <BriefcaseIcon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />,
  other: <CalendarIcon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />,
}

function fmtTime(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

interface CalendarWidgetProps {
  clientId: string
  todayWorkout: WorkoutDay | null
  currentWeek: number
  workoutLogged?: boolean
}

export function CalendarWidget({ clientId, todayWorkout, currentWeek, workoutLogged }: CalendarWidgetProps) {
  const { isConnected, connect, events, getFreeSlots, getEveningSlots, addWorkoutEvent, loading, error } =
    useGoogleCalendar(clientId)
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  if (!clientId) return null

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface-800 rounded-2xl hover:bg-surface-700 transition-colors"
      >
        <CalendarIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <div className="text-left">
          <p className="text-sm font-semibold text-slate-200">Connect Google Calendar</p>
          <p className="text-xs text-slate-500">See your day, find workout windows, get family activity ideas</p>
        </div>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="px-4 py-3 bg-surface-800 rounded-2xl">
        <p className="text-sm text-slate-400 animate-pulse">Loading your calendar...</p>
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

  const slots = getFreeSlots()
  const eveningSlots = getEveningSlots()
  const nextSlot = slots[0] ?? null
  const hourNow = new Date().getHours()
  const workoutWindowPassed = hourNow >= 7
  const missedWorkout = workoutWindowPassed && !workoutLogged && todayWorkout !== null

  const categorized = events.map((e) => ({
    ...e,
    category: categorizeEvent(e.summary ?? ''),
  }))
  const notableEvents = categorized.filter((e) => e.category !== 'work' && e.summary)
  const physicalEvents = categorized.filter((e) => e.category === 'physical')
  const hasFreeEvening = eveningSlots.length > 0

  const handleAdd = async () => {
    if (!todayWorkout || !nextSlot) return
    setAdding(true)
    const description = todayWorkout.exercises
      .map((ex) => `• ${ex.name} — ${ex.sets} sets × ${ex.reps} reps`)
      .join('\n')
    const ok = await addWorkoutEvent(`${todayWorkout.name} – Week ${currentWeek}`, description, nextSlot)
    setAdding(false)
    if (ok) setAdded(true)
  }

  const activityIdea = FAMILY_ACTIVITY_IDEAS[new Date().getDay() % FAMILY_ACTIVITY_IDEAS.length]

  return (
    <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-slate-200">Today's Schedule</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-success">
          <CheckCircleIcon className="w-3.5 h-3.5" />
          Connected
        </span>
      </div>

      {/* Workout window */}
      {todayWorkout && !workoutLogged && (
        <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${workoutWindowPassed ? 'bg-warn/5' : 'bg-success/5'}`}>
          <div>
            <p className={`text-xs font-semibold ${workoutWindowPassed ? 'text-warn' : 'text-success'}`}>
              {workoutWindowPassed ? 'Workout window passed' : '5–6 AM workout window open'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{todayWorkout.name}</p>
          </div>
          {!workoutWindowPassed && nextSlot && (
            <button
              onClick={handleAdd}
              disabled={adding || added}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                added ? 'bg-success/20 text-success' : 'bg-success/15 text-success hover:bg-success/25'
              }`}
            >
              {added ? (
                <><CheckCircleIcon className="w-3 h-3" /> Added</>
              ) : (
                <><PlusIcon className="w-3 h-3" /> {adding ? 'Adding…' : 'Block time'}</>
              )}
            </button>
          )}
        </div>
      )}

      {workoutLogged && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-success/5">
          <CheckCircleIcon className="w-4 h-4 text-success" />
          <p className="text-xs font-semibold text-success">Workout done for today 🎉</p>
        </div>
      )}

      {/* Notable events list */}
      {notableEvents.length > 0 && (
        <div className="space-y-1.5">
          {notableEvents.map((e) => (
            <div key={e.id} className="flex items-center gap-2">
              {CATEGORY_ICON[e.category]}
              <span className="text-xs text-slate-300 flex-1 truncate">{e.summary}</span>
              <span className="text-[10px] text-slate-600 flex-shrink-0">{fmtTime(e.start)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Soccer game = physical activity credit */}
      {physicalEvents.length > 0 && (
        <p className="text-[10px] text-accent bg-accent/5 rounded-lg px-2.5 py-1.5">
          ⚽ {physicalEvents[0].summary} counts as active time — great for your steps goal.
        </p>
      )}

      {/* Missed workout + free evening → family activity suggestion */}
      {missedWorkout && hasFreeEvening && (
        <div className="bg-blue-400/5 rounded-xl px-3 py-2.5 space-y-1">
          <p className="text-xs font-semibold text-blue-400">Free at {eveningSlots[0].label} — move with the kids</p>
          <p className="text-xs text-slate-400">{activityIdea} — counts toward your daily activity goal.</p>
        </div>
      )}

      {/* No events and free evening → proactive suggestion */}
      {notableEvents.length === 0 && hasFreeEvening && !missedWorkout && (
        <p className="text-[10px] text-slate-600">
          Evening looks clear — {activityIdea.toLowerCase()} could be a great end to the day.
        </p>
      )}

      {notableEvents.length === 0 && events.length === 0 && (
        <p className="text-xs text-slate-600">No events today. All clear.</p>
      )}
    </div>
  )
}

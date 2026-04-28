import { useReducer, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { WorkoutCard } from '../components/workout/WorkoutCard'
import { PhaseChip } from '../components/workout/PhaseChip'
import { Button } from '../components/shared/Button'
import { EmptyState } from '../components/shared/EmptyState'
import { useCurrentWeek } from '../hooks/useCurrentWeek'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { useSettings } from '../hooks/useSettings'
import { getWorkoutForDay } from '../data/program'
import { getTargetWeight } from '../data/progressiveOverload'
import type { ExerciseLog, WorkoutLog, DayOfWeek } from '../types'
import { MoonIcon } from '@heroicons/react/24/outline'
import { celebrateWorkout } from '../utils/celebrate'

interface SessionState {
  exercises: ExerciseLog[]
  startedAt: string
}

type Action =
  | { type: 'UPDATE_EXERCISE'; idx: number; exercise: ExerciseLog }
  | { type: 'INIT'; exercises: ExerciseLog[] }

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'INIT':
      return { ...state, exercises: action.exercises, startedAt: new Date().toISOString() }
    case 'UPDATE_EXERCISE': {
      const exercises = state.exercises.map((e, i) =>
        i === action.idx ? action.exercise : e
      )
      return { ...state, exercises }
    }
  }
}

function getDayOfWeek(date?: string): DayOfWeek {
  const days: DayOfWeek[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  ]
  const d = date ? new Date(date + 'T12:00:00') : new Date()
  return days[d.getDay()]
}

const TIME_EXERCISE_IDS = new Set([
  'plank-hold', 'cable-woodchops', 'treadmill-hiit',
  'bike-steady-state', 'light-treadmill', 'foam-rolling', 'yoga-flow',
])

export default function WorkoutPage() {
  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const today = new Date().toISOString().split('T')[0]
  const date = dateParam ?? today

  const { settings } = useSettings()
  const startDate = settings.programStartDate || today
  const { week, phase } = useCurrentWeek(startDate)
  const { upsertLog, getLogByDate } = useWorkoutLog()

  const dayOfWeek = getDayOfWeek(date)
  const workoutDay = getWorkoutForDay(dayOfWeek)

  const existingLog = getLogByDate(date)

  const buildInitialExercises = useCallback((): ExerciseLog[] => {
    return workoutDay.exercises.map((ex) => {
      const target = ex.hasProgressiveOverload ? getTargetWeight(ex.id, week) : undefined
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        targetWeight: target,
        sets: Array.from({ length: ex.defaultSets }, (_, i) => ({
          setNumber: i + 1,
          weight: target ?? 0,
          reps: ex.repRange[1],
          completed: false,
        })),
      }
    })
  }, [workoutDay, week])

  const [session, dispatch] = useReducer(reducer, {
    exercises: existingLog?.exercises ?? buildInitialExercises(),
    startedAt: existingLog?.startedAt ?? new Date().toISOString(),
  })

  useEffect(() => {
    if (!existingLog) {
      dispatch({ type: 'INIT', exercises: buildInitialExercises() })
    }
  }, [existingLog, buildInitialExercises])

  const totalSets = session.exercises.reduce((s, e) => s + e.sets.length, 0)
  const completedSets = session.exercises.reduce(
    (s, e) => s + e.sets.filter((set) => set.completed).length,
    0
  )
  const allDone = completedSets === totalSets && totalSets > 0
  const celebratedRef = useRef(false)

  // Fire once when all sets are completed
  useEffect(() => {
    if (allDone && !celebratedRef.current) {
      celebratedRef.current = true
      celebrateWorkout()
    }
  }, [allDone])

  const saveLog = useCallback(
    (completed: boolean) => {
      const log: WorkoutLog = {
        id: existingLog?.id ?? crypto.randomUUID(),
        date,
        dayOfWeek,
        phase: phase.phase,
        programWeek: week,
        exercises: session.exercises,
        startedAt: session.startedAt,
        completedAt: completed ? new Date().toISOString() : undefined,
      }
      upsertLog(log)
    },
    [date, dayOfWeek, phase, week, session, upsertLog]
  )

  // Auto-save on change
  useEffect(() => {
    const id = setTimeout(() => saveLog(false), 1000)
    return () => clearTimeout(id)
  }, [saveLog])

  if (workoutDay.isRest) {
    return (
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <PageHeader title="Today's Workout" />
        <EmptyState
          icon={<MoonIcon className="w-12 h-12" />}
          title="Rest Day"
          description="No workout scheduled. Recovery is part of the process."
        />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <PageHeader
        title={workoutDay.label}
        subtitle={workoutDay.focusLabel}
        action={<PhaseChip phase={phase} week={week} size="sm" />}
      />

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{completedSets} / {totalSets} sets completed</span>
          <span>{totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0}%</span>
        </div>
        <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {session.exercises.map((ex, idx) => (
          <WorkoutCard
            key={ex.exerciseId}
            exerciseLog={ex}
            isTimeExercise={TIME_EXERCISE_IDS.has(ex.exerciseId)}
            onChange={(updated) => dispatch({ type: 'UPDATE_EXERCISE', idx, exercise: updated })}
          />
        ))}
      </div>

      <div className="mt-5">
        <Button
          fullWidth
          size="lg"
          variant={allDone ? 'primary' : 'secondary'}
          onClick={() => saveLog(true)}
        >
          {allDone ? '🏆 Finish Workout' : 'Save Progress'}
        </Button>
      </div>

      {existingLog?.completedAt && (
        <p className="text-center text-sm text-success mt-3 font-semibold">
          ✓ Workout completed!{' '}
          {new Date(existingLog.completedAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}

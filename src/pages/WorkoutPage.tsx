import { useReducer, useEffect, useCallback, useMemo, useRef, useState } from 'react'
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
import { CelebrationBanner, type CelebrationMessage } from '../components/shared/CelebrationBanner'
import { celebrateSingle, celebrateWorkout } from '../utils/celebrate'
import { computeRestAfterSet, type RestProfile } from '../utils/workoutRestPolicy'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface SessionState {
  exercises: ExerciseLog[]
  startedAt: string
}

type Action =
  | { type: 'UPDATE_EXERCISE'; idx: number; exercise: ExerciseLog }
  | { type: 'INIT'; exercises: ExerciseLog[] }
  | { type: 'DELETE_EXERCISE'; idx: number }
  | { type: 'MOVE_EXERCISE'; fromIdx: number; toIdx: number }

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
    case 'DELETE_EXERCISE': {
      return { ...state, exercises: state.exercises.filter((_, i) => i !== action.idx) }
    }
    case 'MOVE_EXERCISE': {
      const { fromIdx, toIdx } = action
      if (toIdx < 0 || toIdx >= state.exercises.length) return state
      const exercises = [...state.exercises]
      const [moved] = exercises.splice(fromIdx, 1)
      exercises.splice(toIdx, 0, moved)
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

const SUPERSET_GROUPS: Record<string, string> = {
  // Monday PUSH — oh-press + tricep-pushdowns are both Tonal: keep sequential, not a superset
  'incline-db-press': 'push-a',
  'lateral-raises': 'push-a',
  // Tuesday PULL — cable-row + face-pulls are both Tonal: keep sequential
  'bicep-curls': 'pull-a',
  'hammer-curls': 'pull-a',
  'reverse-flyes': 'pull-a',
  // Wednesday LEGS + Core
  'goblet-squat': 'legs-b',
  'rdl': 'legs-b',
  'walking-lunges': 'legs-a',
  'leg-curls': 'legs-a',
  'plank-hold': 'core-a',
  'cable-woodchops': 'core-a',
  // Thursday PUSH (Shoulder)
  'arnold-press': 'push-c',
  'cable-front-raise': 'push-c',
  'weighted-pushups': 'push-d',
  'oh-tricep-ext': 'push-d',
  // Friday PULL (Back)
  'single-arm-row': 'pull-c',
  'chin-ups': 'pull-c',
}

type WorkoutTab = 'now' | 'plan' | 'history'

export default function WorkoutPage() {
  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const tabParam = searchParams.get('tab')
  const today = new Date().toISOString().split('T')[0]
  const date = dateParam ?? today

  const { settings } = useSettings()
  const startDate = settings.programStartDate || today
  const { week, phase } = useCurrentWeek(startDate)
  const { upsertLog, getLogByDate, getProgressionInsight } = useWorkoutLog()

  const dayOfWeek = getDayOfWeek(date)
  const workoutDay = getWorkoutForDay(dayOfWeek)

  const existingLog = getLogByDate(date)
  const defaultTab: WorkoutTab =
    tabParam === 'now' || tabParam === 'plan' || tabParam === 'history'
      ? tabParam
      : workoutDay.isRest
        ? 'plan'
        : 'now'
  const [activeTab, setActiveTab] = useState<WorkoutTab>(defaultTab)
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0)
  const [restProfile, setRestProfile] = useState<RestProfile | null>(null)

  useEffect(() => {
    setRestProfile(null)
  }, [date])

  const buildInitialExercises = useCallback((): ExerciseLog[] => {
    return workoutDay.exercises.map((ex) => {
      const staticTarget = ex.hasProgressiveOverload ? getTargetWeight(ex.id, week) : undefined
      const target = ex.hasProgressiveOverload
        ? getProgressionInsight(ex.id, date, staticTarget, ex.repRange[0]).suggestedWeight
        : undefined
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        supersetGroupId: SUPERSET_GROUPS[ex.id],
        targetWeight: target,
        sets: Array.from({ length: ex.defaultSets }, (_, i) => ({
          setNumber: i + 1,
          weight: target ?? 0,
          reps: ex.repRange[1],
          completed: false,
          roundIndex: i + 1,
        })),
      }
    })
  }, [workoutDay, week, getProgressionInsight, date])

  const [session, dispatch] = useReducer(reducer, {
    exercises: existingLog?.exercises ?? buildInitialExercises(),
    startedAt: existingLog?.startedAt ?? new Date().toISOString(),
  })

  const bumpExerciseBlock = useCallback((delta: number) => {
    setActiveExerciseIndex((prev) => {
      const next = prev + delta
      if (next < 0) return 0
      if (next >= session.exercises.length) return Math.max(0, session.exercises.length - 1)
      return next
    })
  }, [session.exercises.length])

  useEffect(() => {
    if (!existingLog) {
      dispatch({ type: 'INIT', exercises: buildInitialExercises() })
    }
  }, [existingLog, buildInitialExercises])

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  const totalSets = session.exercises.reduce((s, e) => s + e.sets.length, 0)
  const completedSets = session.exercises.reduce(
    (s, e) => s + e.sets.filter((set) => set.completed).length,
    0
  )
  const allDone = completedSets === totalSets && totalSets > 0
  const completedExercises = session.exercises.filter((exercise) => exercise.sets.every((set) => set.completed)).length
  const nowExercise = session.exercises[activeExerciseIndex]
  const celebratedRef = useRef(false)
  const previousCompletedSetsRef = useRef(completedSets)
  const [celebration, setCelebration] = useState<CelebrationMessage | null>(null)

  const showCelebration = useCallback((message: Omit<CelebrationMessage, 'id'>) => {
    setCelebration({ ...message, id: Date.now() })
  }, [])
  const clearCelebration = useCallback(() => setCelebration(null), [])

  // Celebrate forward progress without replaying on initial load.
  useEffect(() => {
    const previousCompletedSets = previousCompletedSetsRef.current

    if (completedSets > previousCompletedSets) {
      if (allDone && !celebratedRef.current) {
        celebratedRef.current = true
        celebrateWorkout()
        showCelebration({
          tone: 'big',
          title: 'Workout crushed. I am proud of you.',
          detail: `${workoutDay.label} is complete. That is real Body faithfulness today.`,
        })
      } else {
        celebrateSingle()
        showCelebration({
          tone: 'warm',
          title: 'Nice set. Keep going.',
          detail: `${completedSets}/${totalSets} sets logged. You are showing up.`,
        })
      }
    }

    if (completedSets < previousCompletedSets) {
      celebratedRef.current = false
    }

    previousCompletedSetsRef.current = completedSets
  }, [allDone, completedSets, showCelebration, totalSets, workoutDay.label])

  const saveLog = useCallback(
    async (completed: boolean) => {
      if (workoutDay.isRest) return
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
      await upsertLog(log)
    },
    [date, dayOfWeek, phase, week, session, upsertLog, existingLog, workoutDay.isRest]
  )

  const handleSave = async () => {
    await saveLog(allDone)
    showCelebration(allDone
      ? {
          tone: 'success',
          title: 'Saved. You did it.',
          detail: 'That workout counts. Take the win and carry it into the rest of your day.',
        }
      : {
          tone: 'warm',
          title: 'Progress saved.',
          detail: 'Partial work still counts. You still moved the day forward.',
        })
  }

  // Auto-save on change
  useEffect(() => {
    if (workoutDay.isRest) return
    const id = setTimeout(() => saveLog(false), 1000)
    return () => clearTimeout(id)
  }, [saveLog, workoutDay.isRest])

  // Advance the focused block when the current exercise is fully logged (does not override manual "back").
  useEffect(() => {
    const current = session.exercises[activeExerciseIndex]
    if (!current?.sets.every((set) => set.completed)) return

    for (let forward = activeExerciseIndex + 1; forward < session.exercises.length; forward++) {
      if (session.exercises[forward]?.sets.some((set) => !set.completed)) {
        setActiveExerciseIndex(forward)
        return
      }
    }

    const firstOpen = session.exercises.findIndex((exercise) => exercise.sets.some((set) => !set.completed))
    if (firstOpen >= 0) setActiveExerciseIndex(firstOpen)
  }, [session.exercises, activeExerciseIndex])

  const getWeightStep = useCallback((exerciseId: string) => {
    const def = workoutDay.exercises.find((ex) => ex.id === exerciseId)
    const equip = def?.equipment?.[0]
    return equip === 'tonal' ? 2.5 : 5
  }, [workoutDay.exercises])

  const getRestAfterComplete = useCallback(
    (exerciseIndex: number, setIndex: number, exercise: ExerciseLog) =>
      computeRestAfterSet(
        exerciseIndex,
        setIndex,
        exercise,
        session.exercises,
        restProfile ?? 'standard'
      ),
    [session.exercises, restProfile]
  )

  const groupedExercises = useMemo(() => {
    if (!nowExercise?.supersetGroupId) return []
    return session.exercises
      .map((exercise, idx) => ({ exercise, idx }))
      .filter(({ exercise, idx }) => idx !== activeExerciseIndex && exercise.supersetGroupId === nowExercise.supersetGroupId)
  }, [session.exercises, nowExercise, activeExerciseIndex])

  const nextUpIndex = useMemo(() => {
    const currentGroupIds = new Set([activeExerciseIndex, ...groupedExercises.map((g) => g.idx)])
    for (let i = activeExerciseIndex + 1; i < session.exercises.length; i++) {
      if (!currentGroupIds.has(i)) return i
    }
    return -1
  }, [session.exercises, activeExerciseIndex, groupedExercises])

  const planGroups = useMemo(() => {
    const seen = new Set<string>()
    const groups: Array<{
      groupId: string | null
      label: string
      exercises: Array<{ ex: ExerciseLog; idx: number }>
    }> = []
    session.exercises.forEach((ex, idx) => {
      if (ex.supersetGroupId) {
        if (!seen.has(ex.supersetGroupId)) {
          seen.add(ex.supersetGroupId)
          const groupExs = session.exercises
            .map((e, i) => ({ ex: e, idx: i }))
            .filter(({ ex: e }) => e.supersetGroupId === ex.supersetGroupId)
          groups.push({
            groupId: ex.supersetGroupId,
            label: groupExs.length >= 3 ? 'Triset' : 'Superset',
            exercises: groupExs,
          })
        }
      } else {
        groups.push({ groupId: null, label: '', exercises: [{ ex, idx }] })
      }
    })
    return groups
  }, [session.exercises])

  const getActiveSetIndex = useCallback((exercise: ExerciseLog): number => {
    const firstOpen = exercise.sets.findIndex((set) => !set.completed)
    return firstOpen >= 0 ? firstOpen : exercise.sets.length - 1
  }, [])

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <PageHeader
        title={workoutDay.isRest ? 'Rest Day' : workoutDay.label}
        subtitle={workoutDay.focusLabel}
        action={workoutDay.isRest ? undefined : <PhaseChip phase={phase} week={week} size="sm" />}
      />

      <div className="mb-4">
        <CelebrationBanner message={celebration} onDone={clearCelebration} />
      </div>

      {activeTab === 'now' && !workoutDay.isRest && restProfile === null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/65 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-labelledby="rest-style-title"
            aria-modal="true"
            className="w-full max-w-md bg-surface-800 border border-surface-600 rounded-2xl p-5 shadow-xl space-y-4"
          >
            <div>
              <h2 id="rest-style-title" className="text-lg font-semibold text-slate-100">
                How do you want to rest today?
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                This sets timers for straight sets and for supersets (short swaps, then a pause between rounds). You can change it tomorrow.
              </p>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full text-left rounded-xl border border-surface-600 bg-surface-700/80 px-4 py-3 hover:border-accent/50 transition-colors"
                onClick={() => setRestProfile('standard')}
              >
                <p className="text-sm font-semibold text-slate-100">Steady / full recovery</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  90s between regular sets · 10s to swap in a superset · 30s pause before the next round
                </p>
              </button>
              <button
                type="button"
                className="w-full text-left rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 hover:border-accent transition-colors"
                onClick={() => setRestProfile('intense')}
              >
                <p className="text-sm font-semibold text-slate-100">Push the pace</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  45s between regular sets · 10s swaps · 15s pauses — still humane, tighter timing
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!workoutDay.isRest && (
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
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-3 bg-surface-800 border border-surface-700 rounded-xl p-1">
          {(['now', 'plan', 'history'] as WorkoutTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-semibold py-2 rounded-lg transition-colors ${
                activeTab === tab ? 'bg-accent text-white' : 'text-slate-400'
              }`}
            >
              {tab === 'now' ? 'Now' : tab === 'plan' ? 'Plan' : 'History'}
            </button>
          ))}
        </div>
        {activeTab === 'now' && workoutDay.isRest && (
          <EmptyState
            icon={<MoonIcon className="w-12 h-12" />}
            title="Formal workout rest day"
            description="Recovery is part of the process. Keep the day light with mobility, walking, and gentle Body consistency."
          />
        )}
        {activeTab === 'now' && !workoutDay.isRest && nowExercise && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-1">
              <button
                type="button"
                aria-label="Previous exercise"
                onClick={() => bumpExerciseBlock(-1)}
                disabled={activeExerciseIndex <= 0}
                className="p-2 rounded-lg text-slate-400 hover:text-accent hover:bg-surface-800 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Exercise {activeExerciseIndex + 1} of {session.exercises.length}
                </p>
                <p className="text-xs text-slate-500">
                  {completedExercises}/{session.exercises.length} done
                </p>
              </div>
              <button
                type="button"
                aria-label="Next exercise"
                onClick={() => bumpExerciseBlock(1)}
                disabled={activeExerciseIndex >= session.exercises.length - 1}
                className="p-2 rounded-lg text-slate-400 hover:text-accent hover:bg-surface-800 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            {groupedExercises.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent border border-accent/40 bg-accent/10 px-2 py-0.5 rounded-full">
                  {groupedExercises.length >= 2 ? 'Triset' : 'Superset'}
                </span>
                <div className="flex-1 h-px bg-surface-600" />
                <span className="text-[10px] text-slate-600">{1 + groupedExercises.length} exercises</span>
              </div>
            )}

            <div className={groupedExercises.length > 0 ? 'pl-3 border-l-2 border-accent/40 space-y-3' : ''}>
              <WorkoutCard
                key={nowExercise.exerciseId}
                exerciseIndex={activeExerciseIndex}
                exerciseLog={nowExercise}
                activeSetIndex={getActiveSetIndex(nowExercise)}
                isTimeExercise={TIME_EXERCISE_IDS.has(nowExercise.exerciseId)}
                weightStep={getWeightStep(nowExercise.exerciseId)}
                getRestAfterComplete={getRestAfterComplete}
                progressionInsight={getProgressionInsight(
                  nowExercise.exerciseId,
                  date,
                  getTargetWeight(nowExercise.exerciseId, week),
                  undefined,
                  {
                    equipment: workoutDay.exercises.find((item) => item.id === nowExercise.exerciseId)?.equipment[0],
                    aggressiveness: settings.progressionAggressiveness,
                    deloadMisses: settings.progressionDeloadMisses,
                    maxJump: settings.progressionMaxJump,
                  }
                )}
                onNext={() => bumpExerciseBlock(1)}
                onChange={(updated) =>
                  dispatch({ type: 'UPDATE_EXERCISE', idx: activeExerciseIndex, exercise: updated })
                }
              />
              {groupedExercises.map(({ exercise, idx }) => (
                <WorkoutCard
                  key={exercise.exerciseId}
                  exerciseIndex={idx}
                  exerciseLog={exercise}
                  activeSetIndex={getActiveSetIndex(exercise)}
                  isTimeExercise={TIME_EXERCISE_IDS.has(exercise.exerciseId)}
                  weightStep={getWeightStep(exercise.exerciseId)}
                  getRestAfterComplete={getRestAfterComplete}
                  progressionInsight={getProgressionInsight(
                    exercise.exerciseId,
                    date,
                    getTargetWeight(exercise.exerciseId, week),
                    undefined,
                    {
                      equipment: workoutDay.exercises.find((item) => item.id === exercise.exerciseId)?.equipment[0],
                      aggressiveness: settings.progressionAggressiveness,
                      deloadMisses: settings.progressionDeloadMisses,
                      maxJump: settings.progressionMaxJump,
                    }
                  )}
                  onNext={() => bumpExerciseBlock(1)}
                  onChange={(updated) =>
                    dispatch({ type: 'UPDATE_EXERCISE', idx, exercise: updated })
                  }
                />
              ))}
            </div>

            {nextUpIndex >= 0 && (
              <div className="opacity-50 border border-surface-700 rounded-xl px-4 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">Next up</p>
                <p className="text-sm text-slate-400 font-medium">
                  {(() => {
                    const nextEx = session.exercises[nextUpIndex]
                    if (nextEx.supersetGroupId) {
                      const partners = session.exercises.filter((e) => e.supersetGroupId === nextEx.supersetGroupId)
                      const label = partners.length >= 3 ? 'Triset' : 'Superset'
                      return `${partners.map((e) => e.exerciseName).join(' + ')} (${label})`
                    }
                    return nextEx.exerciseName
                  })()}
                </p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'plan' && workoutDay.isRest && (
          <EmptyState
            icon={<MoonIcon className="w-12 h-12" />}
            title="No strength plan today"
            description="Today's Body plan is recovery. Keep movement light and use this day to restore."
          />
        )}
        {activeTab === 'plan' && !workoutDay.isRest &&
          planGroups.map((group, gi) => (
            <div key={group.groupId ?? `solo-${gi}`}>
              {group.exercises.length > 1 && (
                <div className="flex items-center gap-2 px-1 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent border border-accent/40 bg-accent/10 px-2 py-0.5 rounded-full">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-surface-600" />
                </div>
              )}
              <div className={group.exercises.length > 1 ? 'pl-3 border-l-2 border-accent/40 space-y-2' : ''}>
                {group.exercises.map(({ ex, idx }) => {
                  const staticTarget = getTargetWeight(ex.exerciseId, week)
                  const insight = getProgressionInsight(ex.exerciseId, date, staticTarget, undefined, {
                    equipment: workoutDay.exercises.find((item) => item.id === ex.exerciseId)?.equipment[0],
                    aggressiveness: settings.progressionAggressiveness,
                    deloadMisses: settings.progressionDeloadMisses,
                    maxJump: settings.progressionMaxJump,
                  })
                  return (
                    <WorkoutCard
                      key={ex.exerciseId}
                      exerciseIndex={idx}
                      exerciseLog={ex}
                      isTimeExercise={TIME_EXERCISE_IDS.has(ex.exerciseId)}
                      progressionInsight={insight}
                      planMode
                      onDelete={() => dispatch({ type: 'DELETE_EXERCISE', idx })}
                      onMoveUp={idx > 0 ? () => dispatch({ type: 'MOVE_EXERCISE', fromIdx: idx, toIdx: idx - 1 }) : undefined}
                      onMoveDown={idx < session.exercises.length - 1 ? () => dispatch({ type: 'MOVE_EXERCISE', fromIdx: idx, toIdx: idx + 1 }) : undefined}
                      onChange={(updated) => dispatch({ type: 'UPDATE_EXERCISE', idx, exercise: updated })}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        {activeTab === 'history' && (
          <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-200">Recent progression</p>
            {session.exercises.slice(0, 6).map((ex) => {
              const insight = getProgressionInsight(ex.exerciseId, date, getTargetWeight(ex.exerciseId, week))
              return (
                <div key={ex.exerciseId} className="flex items-center justify-between text-xs border-b border-surface-700 pb-2 last:border-b-0 last:pb-0">
                  <span className="text-slate-400">{ex.exerciseName}</span>
                  <span className="text-slate-300">
                    {insight.lastWeight ?? '-'} lbs {'->'} {insight.suggestedWeight ?? '-'} lbs
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!workoutDay.isRest && (
      <div className="mt-5">
        <Button
          fullWidth
          size="lg"
          variant={allDone ? 'primary' : 'secondary'}
          onClick={handleSave}
        >
          {allDone ? 'Finish Workout' : 'Save Progress'}
        </Button>
      </div>
      )}

      {!workoutDay.isRest && existingLog?.completedAt && (
        <p className="text-center text-sm text-success mt-3 font-semibold">
          Workout completed. You followed through.{' '}
          {new Date(existingLog.completedAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}

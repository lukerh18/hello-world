import { useState, useEffect, useRef } from 'react'
import type { ExerciseLog, SetLog } from '../../types'
import type { ProgressionInsight } from '../../hooks/useWorkoutLog'
import { SetRow } from './SetRow'
import { ChevronDownIcon, ChevronUpIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, PlusCircleIcon } from '@heroicons/react/24/outline'

interface WorkoutCardProps {
  exerciseIndex: number
  exerciseLog: ExerciseLog
  progressionInsight?: ProgressionInsight
  isTimeExercise?: boolean
  showOnlyActiveSet?: boolean
  activeSetIndex?: number
  planMode?: boolean
  weightStep?: number
  repsStep?: number
  getRestAfterComplete?: (
    exerciseIndex: number,
    setIndex: number,
    exercise: ExerciseLog
  ) => { seconds: number; cue?: string }
  onNext?: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onChange: (updated: ExerciseLog) => void
}

export function WorkoutCard({
  exerciseIndex,
  exerciseLog,
  progressionInsight,
  isTimeExercise = false,
  showOnlyActiveSet = false,
  activeSetIndex,
  planMode = false,
  weightStep = 2.5,
  repsStep = 1,
  getRestAfterComplete,
  onNext,
  onDelete,
  onMoveUp,
  onMoveDown,
  onChange,
}: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [displaySetIdx, setDisplaySetIdx] = useState(activeSetIndex ?? 0)
  const [timerRunning, setTimerRunning] = useState(false)

  type ActiveRest = { seconds: number; cue?: string; startedAt: number }
  const [activeRest, setActiveRest] = useState<ActiveRest | null>(null)
  const [restSetIndex, setRestSetIndex] = useState<number | null>(null)
  const restForCompletedSetRef = useRef<number | null>(null)

  const setsRef = useRef(exerciseLog.sets)
  setsRef.current = exerciseLog.sets

  useEffect(() => {
    if (!timerRunning) {
      setDisplaySetIdx(activeSetIndex ?? 0)
    }
  }, [activeSetIndex, timerRunning])

  const clearTimer = () => {
    setActiveRest(null)
    setRestSetIndex(null)
    setTimerRunning(false)
    restForCompletedSetRef.current = null
  }

  const completedSets = exerciseLog.sets.filter((s) => s.completed).length
  const totalSets = exerciseLog.sets.length
  const allDone = completedSets === totalSets

  const handleSetChange = (idx: number, updated: SetLog) => {
    const sets = exerciseLog.sets.map((s, i) => (i === idx ? updated : s))
    onChange({ ...exerciseLog, sets })
  }

  const handleSetComplete = (idx: number) => {
    const set = exerciseLog.sets[idx]
    if (set.completed) return
    const updatedSets = exerciseLog.sets.map((s, i) => (i === idx ? { ...s, completed: true } : s))
    const updatedExercise = { ...exerciseLog, sets: updatedSets }
    onChange(updatedExercise)

    const cfg = getRestAfterComplete?.(exerciseIndex, idx, updatedExercise) ?? { seconds: 90 }
    restForCompletedSetRef.current = idx
    setActiveRest({ seconds: cfg.seconds, cue: cfg.cue, startedAt: Date.now() })
    setRestSetIndex(idx)
    setTimerRunning(true)
  }

  const handleSetUndo = (idx: number) => {
    clearTimer()
    handleSetChange(idx, { ...exerciseLog.sets[idx], completed: false })
  }

  const handleRestFinished = () => {
    const completedIdx = restForCompletedSetRef.current
    clearTimer()
    if (completedIdx == null) return
    const nextIdx = setsRef.current.findIndex((s, i) => i > completedIdx && !s.completed)
    if (nextIdx >= 0) setDisplaySetIdx(nextIdx)
  }

  const handleAddSet = () => {
    if (planMode) return
    const last = exerciseLog.sets[exerciseLog.sets.length - 1]
    const n = exerciseLog.sets.length + 1
    onChange({
      ...exerciseLog,
      sets: [
        ...exerciseLog.sets,
        {
          setNumber: n,
          weight: last?.weight ?? 0,
          reps: last?.reps ?? 0,
          completed: false,
          roundIndex: n,
        },
      ],
    })
  }

  const visibleSets = showOnlyActiveSet
    ? exerciseLog.sets.filter((_, i) => i === displaySetIdx)
    : exerciseLog.sets

  return (
    <div className={`bg-surface-800 rounded-2xl overflow-hidden border ${allDone ? 'border-success/30' : 'border-surface-700'}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            allDone ? 'bg-success/20 text-success' : 'bg-surface-700 text-slate-400'
          }`}>
            {allDone ? '✓' : `${completedSets}/${totalSets}`}
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{exerciseLog.exerciseName}</p>
            {exerciseLog.targetWeight !== undefined && (
              <p className="text-xs text-accent font-medium">Target: {exerciseLog.targetWeight} lbs</p>
            )}
            {progressionInsight?.lastWeight !== undefined && progressionInsight.suggestedWeight !== undefined && (
              <p className="text-[11px] text-slate-400">
                Last {progressionInsight.lastWeight} lbs → Next {progressionInsight.suggestedWeight} lbs
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {planMode && (
            <>
              {onMoveUp && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onMoveUp() }}
                  className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowUpIcon className="w-3.5 h-3.5" />
                </span>
              )}
              {onMoveDown && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onMoveDown() }}
                  className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowDownIcon className="w-3.5 h-3.5" />
                </span>
              )}
              {onDelete && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </span>
              )}
            </>
          )}
          <span className="text-slate-500">
            {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {visibleSets.map((set, setIndex) => {
            const idx = showOnlyActiveSet ? displaySetIdx : setIndex
            return (
              <SetRow
                key={idx}
                set={set}
                isTimeSet={isTimeExercise}
                planMode={planMode}
                weightStep={weightStep}
                repsStep={repsStep}
                activeRest={restSetIndex === idx && timerRunning ? activeRest : null}
                onChange={(updated) => handleSetChange(idx, updated)}
                onComplete={() => handleSetComplete(idx)}
                onUndo={() => handleSetUndo(idx)}
                onRestFinished={handleRestFinished}
              />
            )
          })}
          {!planMode && (
            <button
              type="button"
              onClick={handleAddSet}
              className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold py-2 rounded-xl border border-dashed border-surface-600 hover:border-accent/50 hover:text-accent transition-colors"
            >
              <PlusCircleIcon className="w-4 h-4" />
              Add set
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="w-full text-xs text-accent font-semibold py-1.5 hover:text-accent-light transition-colors"
            >
              Skip to next block
            </button>
          )}
        </div>
      )}
    </div>
  )
}

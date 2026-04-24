import { useState } from 'react'
import type { ExerciseLog, SetLog } from '../../types'
import { SetRow } from './SetRow'
import { RestTimer } from './RestTimer'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface WorkoutCardProps {
  exerciseLog: ExerciseLog
  isTimeExercise?: boolean
  onChange: (updated: ExerciseLog) => void
}

export function WorkoutCard({ exerciseLog, isTimeExercise = false, onChange }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [showTimer, setShowTimer] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(90)

  const completedSets = exerciseLog.sets.filter((s) => s.completed).length
  const totalSets = exerciseLog.sets.length
  const allDone = completedSets === totalSets

  const handleSetChange = (idx: number, updated: SetLog) => {
    const sets = exerciseLog.sets.map((s, i) => (i === idx ? updated : s))
    onChange({ ...exerciseLog, sets })
  }

  const handleSetComplete = (idx: number) => {
    const set = exerciseLog.sets[idx]
    const isNowComplete = !set.completed
    handleSetChange(idx, { ...set, completed: isNowComplete })
    if (isNowComplete && !allDone) {
      setTimerSeconds(90)
      setShowTimer(true)
    }
  }

  return (
    <div className={`bg-surface-800 rounded-2xl overflow-hidden border ${allDone ? 'border-success/30' : 'border-surface-700'}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              allDone ? 'bg-success/20 text-success' : 'bg-surface-700 text-slate-400'
            }`}
          >
            {allDone ? '✓' : `${completedSets}/${totalSets}`}
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{exerciseLog.exerciseName}</p>
            {exerciseLog.targetWeight !== undefined && (
              <p className="text-xs text-accent font-medium">Target: {exerciseLog.targetWeight} lbs</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-2 text-slate-500">
          {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {exerciseLog.sets.map((set, idx) => (
            <SetRow
              key={idx}
              set={set}
              isTimeSet={isTimeExercise}
              onChange={(updated) => handleSetChange(idx, updated)}
              onComplete={() => handleSetComplete(idx)}
            />
          ))}
          {showTimer && (
            <RestTimer seconds={timerSeconds} onDismiss={() => setShowTimer(false)} />
          )}
        </div>
      )}
    </div>
  )
}

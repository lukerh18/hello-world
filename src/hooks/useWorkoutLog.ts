import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { WorkoutLog } from '../types'

export function useWorkoutLog() {
  const [logs, setLogs] = useLocalStorage<WorkoutLog[]>('workout_logs', [])

  const today = new Date().toISOString().split('T')[0]

  const getTodayLog = useCallback((): WorkoutLog | undefined => {
    return logs.find((l) => l.date === today)
  }, [logs, today])

  const getLogByDate = useCallback(
    (date: string): WorkoutLog | undefined => {
      return logs.find((l) => l.date === date)
    },
    [logs]
  )

  const upsertLog = useCallback(
    (log: WorkoutLog) => {
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.id === log.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = log
          return next
        }
        return [...prev, log]
      })
    },
    [setLogs]
  )

  const getLogsForExercise = useCallback(
    (exerciseId: string) => {
      return logs
        .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
        .map((l) => ({
          date: l.date,
          exercise: l.exercises.find((e) => e.exerciseId === exerciseId)!,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    },
    [logs]
  )

  const getCompletedDates = useCallback((): string[] => {
    return logs.filter((l) => l.completedAt).map((l) => l.date)
  }, [logs])

  return {
    logs,
    today,
    getTodayLog,
    getLogByDate,
    upsertLog,
    getLogsForExercise,
    getCompletedDates,
  }
}

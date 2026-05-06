import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { WorkoutLog } from '../types'

export type ProgressionTrend = 'up' | 'hold' | 'down'

export interface ProgressionInsight {
  suggestedWeight?: number
  lastWeight?: number
  trend: ProgressionTrend
  reason?: string
  confidence?: 'low' | 'medium' | 'high'
}

export function useWorkoutLog() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const today = new Date().toISOString().split('T')[0]

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    if (!user) { setLogs([]); setLoading(false); return }
    setLoading(true)

    supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load workout logs', error)
          setLogs([])
          return
        }
        const rows = (data ?? []).map(rowToLog)
        const byDate = new Map<string, WorkoutLog>()
        for (const row of rows) {
          const current = byDate.get(row.date)
          if (!current) {
            byDate.set(row.date, row)
            continue
          }
          const currentCompleted = current.completedAt ? Date.parse(current.completedAt) : 0
          const candidateCompleted = row.completedAt ? Date.parse(row.completedAt) : 0
          if (candidateCompleted >= currentCompleted) byDate.set(row.date, row)
        }
        setLogs(Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date)))
      })
      .catch((error) => {
        console.error('Failed to load workout logs', error)
        setLogs([])
      })
      .finally(() => setLoading(false))
  }, [user, refreshKey])

  const getTodayLog = useCallback((): WorkoutLog | undefined => {
    return logs.find((l) => l.date === today)
  }, [logs, today])

  const getLogByDate = useCallback(
    (date: string): WorkoutLog | undefined => logs.find((l) => l.date === date),
    [logs]
  )

  const upsertLog = useCallback(async (log: WorkoutLog) => {
    if (!user) return
    const row = logToRow(log, user.id)
    let { data, error } = await supabase
      .from('workout_logs')
      // Keep one row per user/day. ID-based upserts can create duplicate dates and stale reads.
      .upsert(row, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) {
      // Fallback for environments where a unique (user_id, date) constraint is not present yet.
      const fallback = await supabase
        .from('workout_logs')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single()
      data = fallback.data
      error = fallback.error
      if (error) {
        console.error('Failed to save workout log', error)
        return
      }
    }

    if (data) {
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.date === log.date || l.id === log.id)
        if (idx >= 0) { const next = [...prev]; next[idx] = rowToLog(data); return next }
        return [rowToLog(data), ...prev]
      })
    }

    refresh()
  }, [user, refresh])

  const getLogsForExercise = useCallback(
    (exerciseId: string) =>
      logs
        .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
        .map((l) => ({ date: l.date, exercise: l.exercises.find((e) => e.exerciseId === exerciseId)! }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [logs]
  )

  const getSuggestedWeight = useCallback(
    (
      exerciseId: string,
      date: string,
      fallbackWeight?: number,
      targetRepsFloor = 8,
      options?: {
        equipment?: 'tonal' | 'kettlebell' | 'bodyweight' | 'treadmill' | 'bike'
        aggressiveness?: 'conservative' | 'balanced' | 'assertive'
        deloadMisses?: number
        maxJump?: number
      }
    ): number | undefined => {
      const priorLogs = logs
        .filter((log) => log.date < date && Boolean(log.completedAt))
        .filter((log) => log.exercises.some((exercise) => exercise.exerciseId === exerciseId))
        .sort((a, b) => b.date.localeCompare(a.date))

      if (priorLogs.length === 0) return fallbackWeight

      const getSessionStats = (log: WorkoutLog) => {
        const exercise = log.exercises.find((item) => item.exerciseId === exerciseId)
        if (!exercise) return null

        const positiveSets = exercise.sets.filter((set) => set.weight > 0 || set.reps > 0)
        if (positiveSets.length === 0) return null

        const completedSets = positiveSets.filter((set) => set.completed)
        const setsForPerformance = completedSets.length > 0 ? completedSets : positiveSets
        const topWeight = setsForPerformance.reduce((max, set) => Math.max(max, set.weight), 0)
        const avgReps =
          setsForPerformance.reduce((sum, set) => sum + set.reps, 0) / setsForPerformance.length
        const completionRatio = completedSets.length / positiveSets.length

        return { topWeight, avgReps, completionRatio }
      }

      const latestStats = getSessionStats(priorLogs[0])
      if (!latestStats || latestStats.topWeight <= 0) return fallbackWeight

      const previousStats = priorLogs.length > 1 ? getSessionStats(priorLogs[1]) : null
      const equipmentStep = (() => {
        if (options?.equipment === 'kettlebell') return 5
        if (options?.equipment === 'tonal') return 2.5
        return latestStats.topWeight >= 100 ? 5 : 2.5
      })()
      const aggressionMultiplier =
        options?.aggressiveness === 'conservative'
          ? 0.8
          : options?.aggressiveness === 'assertive'
            ? 1.2
            : 1
      const baseStep = equipmentStep * aggressionMultiplier
      const maxJump = Math.max(equipmentStep, options?.maxJump ?? 5)
      const step = Math.min(maxJump, Math.max(2.5, Math.round(baseStep / 2.5) * 2.5))
      const roundToStep = (value: number) => Math.max(step, Math.round(value / step) * step)

      const wasStrongSession =
        latestStats.completionRatio >= 0.9 && latestStats.avgReps >= targetRepsFloor
      const wasWeakSession =
        latestStats.completionRatio < 0.6 || latestStats.avgReps < Math.max(1, targetRepsFloor - 2)
      const weakHistory = priorLogs.slice(0, Math.max(2, options?.deloadMisses ?? 3))
      const weakCount = weakHistory.filter((log) => {
        const stats = getSessionStats(log)
        if (!stats) return false
        return stats.completionRatio < 0.6 || stats.avgReps < Math.max(1, targetRepsFloor - 2)
      }).length
      const weakStreak =
        wasWeakSession &&
        Boolean(
          previousStats &&
            (previousStats.completionRatio < 0.6 ||
              previousStats.avgReps < Math.max(1, targetRepsFloor - 2))
        ) &&
        weakCount >= (options?.deloadMisses ?? 3)

      if (weakStreak) {
        return roundToStep(latestStats.topWeight * 0.9)
      }

      if (wasStrongSession) {
        return roundToStep(latestStats.topWeight + step)
      }

      return roundToStep(latestStats.topWeight)
    },
    [logs]
  )

  const getProgressionInsight = useCallback(
    (
      exerciseId: string,
      date: string,
      fallbackWeight?: number,
      targetRepsFloor = 8,
      options?: {
        equipment?: 'tonal' | 'kettlebell' | 'bodyweight' | 'treadmill' | 'bike'
        aggressiveness?: 'conservative' | 'balanced' | 'assertive'
        deloadMisses?: number
        maxJump?: number
      }
    ): ProgressionInsight => {
      const priorLogs = logs
        .filter((log) => log.date < date && Boolean(log.completedAt))
        .filter((log) => log.exercises.some((exercise) => exercise.exerciseId === exerciseId))
        .sort((a, b) => b.date.localeCompare(a.date))

      const latest = priorLogs[0]
      const lastWeight = latest
        ? latest.exercises
            .find((exercise) => exercise.exerciseId === exerciseId)
            ?.sets.reduce((max, set) => Math.max(max, set.weight), 0)
        : undefined

      const suggestedWeight = getSuggestedWeight(exerciseId, date, fallbackWeight, targetRepsFloor, options)

      if (!lastWeight || !suggestedWeight) {
        return {
          suggestedWeight,
          lastWeight,
          trend: 'hold',
          reason: 'Need more completed sessions to personalize this lift.',
          confidence: 'low',
        }
      }

      const recentSessions = priorLogs.slice(0, 2)
      const successfulSessions = recentSessions.filter((log) => {
        const exercise = log.exercises.find((item) => item.exerciseId === exerciseId)
        if (!exercise) return false
        const completed = exercise.sets.filter((set) => set.completed)
        if (completed.length === 0) return false
        const avgReps = completed.reduce((sum, set) => sum + set.reps, 0) / completed.length
        return avgReps >= targetRepsFloor
      }).length

      if (suggestedWeight > lastWeight) {
        return {
          suggestedWeight,
          lastWeight,
          trend: 'up',
          reason: `Suggested increase from ${successfulSessions} recent successful session${successfulSessions === 1 ? '' : 's'}.`,
          confidence: successfulSessions >= 2 ? 'high' : 'medium',
        }
      }
      if (suggestedWeight < lastWeight) {
        return {
          suggestedWeight,
          lastWeight,
          trend: 'down',
          reason: 'Recent sessions missed rep target. Small deload can improve quality reps.',
          confidence: 'medium',
        }
      }
      return {
        suggestedWeight,
        lastWeight,
        trend: 'hold',
        reason: 'Keep this load to build consistency before increasing.',
        confidence: 'high',
      }
    },
    [logs, getSuggestedWeight]
  )

  const getCompletedDates = useCallback(
    (): string[] => logs.filter((l) => l.completedAt).map((l) => l.date),
    [logs]
  )

  return {
    logs,
    loading,
    refresh,
    today,
    getTodayLog,
    getLogByDate,
    upsertLog,
    getLogsForExercise,
    getCompletedDates,
    getSuggestedWeight,
    getProgressionInsight,
  }
}

function rowToLog(row: Record<string, unknown>): WorkoutLog {
  return {
    id: row.id as string,
    date: row.date as string,
    dayOfWeek: row.day_of_week as WorkoutLog['dayOfWeek'],
    phase: row.phase as WorkoutLog['phase'],
    programWeek: row.program_week as number,
    exercises: row.exercises as WorkoutLog['exercises'],
    startedAt: row.started_at as string | undefined,
    completedAt: row.completed_at as string | undefined,
    notes: row.notes as string | undefined,
  }
}

function logToRow(log: WorkoutLog, userId: string) {
  return {
    id: log.id,
    user_id: userId,
    date: log.date,
    day_of_week: log.dayOfWeek,
    phase: log.phase,
    program_week: log.programWeek,
    exercises: log.exercises,
    started_at: log.startedAt ?? null,
    completed_at: log.completedAt ?? null,
    notes: log.notes ?? null,
  }
}

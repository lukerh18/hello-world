import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { WorkoutLog } from '../types'

export function useWorkoutLog() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user) { setLogs([]); setLoading(false); return }

    supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setLogs((data ?? []).map(rowToLog))
        setLoading(false)
      })
  }, [user])

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
    const { data } = await supabase
      .from('workout_logs')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (data) {
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.id === log.id)
        if (idx >= 0) { const next = [...prev]; next[idx] = rowToLog(data); return next }
        return [rowToLog(data), ...prev]
      })
    }
  }, [user])

  const getLogsForExercise = useCallback(
    (exerciseId: string) =>
      logs
        .filter((l) => l.exercises.some((e) => e.exerciseId === exerciseId))
        .map((l) => ({ date: l.date, exercise: l.exercises.find((e) => e.exerciseId === exerciseId)! }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [logs]
  )

  const getCompletedDates = useCallback(
    (): string[] => logs.filter((l) => l.completedAt).map((l) => l.date),
    [logs]
  )

  return { logs, loading, today, getTodayLog, getLogByDate, upsertLog, getLogsForExercise, getCompletedDates }
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

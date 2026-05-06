import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MovementLogEntry, MovementType } from '../types'

const STORAGE_KEY = 'movement_log_v1'
const LEGACY_STORAGE_KEY = 'movement_logs_v1'
const UPDATE_EVENT = 'movement-log-updated'
const MS_PER_DAY = 86400000

function readLog(): MovementLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const current = raw ? (JSON.parse(raw) as MovementLogEntry[]) : []
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    const legacy = legacyRaw ? (JSON.parse(legacyRaw) as MovementLogEntry[]) : []
    const byId = new Map([...legacy, ...current].map((entry) => [entry.id, entry]))
    return Array.from(byId.values())
  } catch {
    return []
  }
}

function writeLog(entries: MovementLogEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

function dateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

export interface MovementQuickEntry {
  type: MovementType
  label: string
  minutes?: number
  count?: number
  note?: string
}

export interface MovementSummary {
  breaks: number
  minutes: number
  reps: number
  walks: number
}

export interface MovementWeekSummary extends MovementSummary {
  stretches: number
  strengthSnacks: number
}

function summarize(entries: MovementLogEntry[]): MovementSummary {
  return {
    breaks: entries.length,
    minutes: entries.reduce((sum, entry) => sum + (entry.minutes ?? 0), 0),
    reps: entries.reduce((sum, entry) => sum + (entry.count ?? 0), 0),
    walks: entries.filter((entry) => entry.type === 'walk' || entry.type === 'call_walk').length,
  }
}

export function useMovementLog(date = dateKey(new Date())) {
  const today = dateKey(new Date())
  const [entries, setEntries] = useState<MovementLogEntry[]>(readLog)

  useEffect(() => {
    const onUpdate = () => setEntries(readLog())
    window.addEventListener(UPDATE_EVENT, onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener(UPDATE_EVENT, onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [])

  const addEntry = useCallback(
    (entry: MovementQuickEntry) => {
      const nextEntry: MovementLogEntry = {
        id: crypto.randomUUID(),
        date,
        ...entry,
        completedAt: new Date().toISOString(),
      }
      setEntries((prev) => {
        const next = [nextEntry, ...prev]
        writeLog(next)
        return next
      })
      return nextEntry
    },
    [date]
  )

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((entry) => entry.id !== id)
      writeLog(next)
      return next
    })
  }, [])

  const todayEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.date === date)
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [entries, date]
  )

  const getEntriesByDate = useCallback(
    (entryDate: string): MovementLogEntry[] =>
      entries
        .filter((entry) => entry.date === entryDate)
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [entries]
  )

  const getSummaryForDate = useCallback(
    (entryDate: string): MovementSummary => summarize(getEntriesByDate(entryDate)),
    [getEntriesByDate]
  )

  const summary = useMemo(() => summarize(todayEntries), [todayEntries])

  const streak = useMemo(() => {
    const completedDates = new Set(entries.map((entry) => entry.date))
    let count = 0
    const cursor = new Date()

    while (true) {
      const key = dateKey(cursor)
      if (!completedDates.has(key)) break
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    return count
  }, [entries])

  const weeklySummary = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - 6)
    const startKey = dateKey(start)
    const recent = entries.filter((entry) => entry.date >= startKey)
    return {
      ...summarize(recent),
      stretches: recent.filter((entry) => entry.type === 'stretch' || entry.type === 'mobility').length,
      strengthSnacks: recent.filter((entry) => entry.type === 'pushups' || entry.type === 'squats').length,
    }
  }, [entries])

  const getMovementStreak = useCallback(
    (fromDate = today): number => {
      const activeDates = new Set(entries.map((entry) => entry.date))
      let streak = 0
      const cursor = new Date(`${fromDate}T12:00:00`)

      while (activeDates.has(dateKey(cursor))) {
        streak += 1
        cursor.setDate(cursor.getDate() - 1)
      }

      return streak
    },
    [entries, today]
  )

  const getWeekSummary = useCallback(
    (endingDate = today): MovementWeekSummary => {
      const end = new Date(`${endingDate}T12:00:00`)
      const start = new Date(end.getTime() - 6 * MS_PER_DAY)
      const weekEntries = entries.filter((entry) => {
        const completed = new Date(`${entry.date}T12:00:00`)
        return completed >= start && completed <= end
      })
      const base = summarize(weekEntries)

      return {
        ...base,
        stretches: weekEntries.filter((entry) => entry.type === 'stretch' || entry.type === 'mobility').length,
        strengthSnacks: weekEntries.filter((entry) => entry.type === 'pushups' || entry.type === 'squats').length,
      }
    },
    [entries, today]
  )

  return {
    entries,
    today,
    addEntry,
    deleteEntry,
    todayEntries,
    summary,
    streak,
    weeklySummary,
    getEntriesByDate,
    getSummaryForDate,
    getMovementStreak,
    getWeekSummary,
  }
}

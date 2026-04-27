import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { DEFAULT_HABITS } from '../data/habits'
import type { Habit } from '../data/habits'

interface HabitConfig {
  habits: Habit[]
  northStar: string
  weekFocus: string
}

interface HabitLogEntry {
  date: string
  completedIds: string[]
  choreDone: boolean
}

const INITIAL_CONFIG: HabitConfig = {
  habits: DEFAULT_HABITS,
  northStar: '',
  weekFocus: '',
}

export function useHabits() {
  const [config, setConfig] = useLocalStorage<HabitConfig>('habits_config_v1', INITIAL_CONFIG)
  const [log, setLog] = useLocalStorage<HabitLogEntry[]>('habit_log_v1', [])

  const today = new Date().toISOString().split('T')[0]
  const dayOfWeek = new Date().getDay()
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

  const todayEntry: HabitLogEntry =
    log.find((e) => e.date === today) ?? { date: today, completedIds: [], choreDone: false }

  const todayHabits = config.habits.filter((h) => !h.weekdaysOnly || isWeekday)

  const isHabitDone = useCallback(
    (id: string) => todayEntry.completedIds.includes(id),
    [todayEntry]
  )

  const updateTodayLog = useCallback(
    (updater: (entry: HabitLogEntry) => HabitLogEntry) => {
      setLog((prev) => {
        const idx = prev.findIndex((e) => e.date === today)
        const entry = idx >= 0 ? prev[idx] : { date: today, completedIds: [], choreDone: false }
        const updated = updater(entry)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [...prev, updated]
      })
    },
    [today, setLog]
  )

  const toggleHabit = useCallback(
    (id: string) => {
      updateTodayLog((e) => {
        const has = e.completedIds.includes(id)
        return {
          ...e,
          completedIds: has ? e.completedIds.filter((i) => i !== id) : [...e.completedIds, id],
        }
      })
    },
    [updateTodayLog]
  )

  const toggleChore = useCallback(() => {
    updateTodayLog((e) => ({ ...e, choreDone: !e.choreDone }))
  }, [updateTodayLog])

  const addHabit = useCallback(
    (habit: Omit<Habit, 'id'>) => {
      setConfig((prev) => ({
        ...prev,
        habits: [...prev.habits, { ...habit, id: crypto.randomUUID() }],
      }))
    },
    [setConfig]
  )

  const deleteHabit = useCallback(
    (id: string) => {
      setConfig((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }))
    },
    [setConfig]
  )

  const setNorthStar = useCallback(
    (text: string) => setConfig((prev) => ({ ...prev, northStar: text })),
    [setConfig]
  )

  const setWeekFocus = useCallback(
    (text: string) => setConfig((prev) => ({ ...prev, weekFocus: text })),
    [setConfig]
  )

  // Consecutive days with at least one habit or chore done (starts from yesterday)
  const streak = (() => {
    let s = 0
    const d = new Date()
    d.setDate(d.getDate() - 1)
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split('T')[0]
      const entry = log.find((e) => e.date === key)
      if (entry && (entry.completedIds.length > 0 || entry.choreDone)) {
        s++
        d.setDate(d.getDate() - 1)
      } else break
    }
    return s
  })()

  const doneCount = todayHabits.filter((h) => isHabitDone(h.id)).length + (todayEntry.choreDone ? 1 : 0)
  const totalCount = todayHabits.length + 1

  return {
    habits: config.habits,
    todayHabits,
    northStar: config.northStar,
    weekFocus: config.weekFocus,
    isHabitDone,
    isChoreDone: todayEntry.choreDone,
    toggleHabit,
    toggleChore,
    addHabit,
    deleteHabit,
    setNorthStar,
    setWeekFocus,
    streak,
    doneCount,
    totalCount,
  }
}

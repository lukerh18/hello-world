import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { DEFAULT_HABITS, normalizeCategory } from '../data/habits'
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
  majorTask: string
}

const INITIAL_CONFIG: HabitConfig = { habits: DEFAULT_HABITS, northStar: '', weekFocus: '' }
const LS_CONFIG = 'habits_config_v1'
const LS_LOG = 'habit_log_v1'

function lsReadConfig(): HabitConfig {
  try {
    const raw = localStorage.getItem(LS_CONFIG)
    if (!raw) return INITIAL_CONFIG
    const parsed = JSON.parse(raw) as Partial<HabitConfig>
    return {
      habits: (parsed.habits ?? DEFAULT_HABITS).map((h) => ({ ...h, category: normalizeCategory(h.category) })),
      northStar: parsed.northStar ?? '',
      weekFocus: parsed.weekFocus ?? '',
    }
  } catch { return INITIAL_CONFIG }
}

function lsReadLog(): HabitLogEntry[] {
  try {
    const raw = localStorage.getItem(LS_LOG)
    return raw ? (JSON.parse(raw) as HabitLogEntry[]) : []
  } catch { return [] }
}

export function useHabits() {
  const { user, isLocal } = useAuth()
  const [config, setConfigState] = useState<HabitConfig>(isLocal ? lsReadConfig() : INITIAL_CONFIG)
  const [log, setLog] = useState<HabitLogEntry[]>(isLocal ? lsReadLog() : [])
  const [loading, setLoading] = useState(!isLocal)

  const today = new Date().toISOString().split('T')[0]
  const dayOfWeek = new Date().getDay()
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

  useEffect(() => {
    if (isLocal) return
    if (!user) { setLoading(false); return }

    Promise.all([
      supabase.from('habit_config').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('habit_log').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(90),
    ]).then(([cfg, logs]) => {
      if (cfg.data) {
        const rawHabits = (cfg.data.habits as Habit[]) ?? DEFAULT_HABITS
        setConfigState({
          habits: rawHabits.map((h) => ({ ...h, category: normalizeCategory(h.category) })),
          northStar: (cfg.data.north_star as string) ?? '',
          weekFocus: (cfg.data.week_focus as string) ?? '',
        })
      }
      setLog((logs.data ?? []).map((r) => ({
        date: r.date as string,
        completedIds: (r.completed_ids as string[]) ?? [],
        choreDone: (r.chore_done as boolean) ?? false,
        majorTask: (r.major_task as string) ?? '',
      })))
      setLoading(false)
    })
  }, [user, isLocal])

  const saveConfig = useCallback(async (next: HabitConfig) => {
    setConfigState(next)
    if (isLocal) {
      localStorage.setItem(LS_CONFIG, JSON.stringify(next))
      return
    }
    if (!user) return
    await supabase.from('habit_config').upsert({
      user_id: user.id,
      habits: next.habits,
      north_star: next.northStar,
      week_focus: next.weekFocus,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }, [user, isLocal])

  const updateTodayLog = useCallback(async (updater: (entry: HabitLogEntry) => HabitLogEntry) => {
    const existing = log.find((e) => e.date === today) ?? { date: today, completedIds: [], choreDone: false, majorTask: '' }
    const updated = updater(existing)
    const nextLog = (() => {
      const idx = log.findIndex((e) => e.date === today)
      if (idx >= 0) { const next = [...log]; next[idx] = updated; return next }
      return [updated, ...log]
    })()
    setLog(nextLog)
    if (isLocal) {
      localStorage.setItem(LS_LOG, JSON.stringify(nextLog))
      return
    }
    if (!user) return
    await supabase.from('habit_log').upsert({
      user_id: user.id,
      date: updated.date,
      completed_ids: updated.completedIds,
      chore_done: updated.choreDone,
      major_task: updated.majorTask,
    }, { onConflict: 'user_id,date' })
  }, [user, isLocal, log, today])

  const todayEntry: HabitLogEntry = log.find((e) => e.date === today) ?? { date: today, completedIds: [], choreDone: false, majorTask: '' }
  const todayHabits = config.habits.filter((h) => !h.weekdaysOnly || isWeekday)

  const isHabitDone = useCallback((id: string) => todayEntry.completedIds.includes(id), [todayEntry])

  const toggleHabit = useCallback((id: string) => {
    updateTodayLog((e) => ({
      ...e,
      completedIds: e.completedIds.includes(id)
        ? e.completedIds.filter((i) => i !== id)
        : [...e.completedIds, id],
    }))
  }, [updateTodayLog])

  const toggleChore = useCallback(() => {
    updateTodayLog((e) => ({ ...e, choreDone: !e.choreDone }))
  }, [updateTodayLog])

  const setMajorTask = useCallback((task: string) => {
    updateTodayLog((e) => ({ ...e, majorTask: task }))
  }, [updateTodayLog])

  const addHabit = useCallback((habit: Omit<Habit, 'id'>) => {
    saveConfig({ ...config, habits: [...config.habits, { ...habit, id: crypto.randomUUID() }] })
  }, [config, saveConfig])

  const deleteHabit = useCallback((id: string) => {
    saveConfig({ ...config, habits: config.habits.filter((h) => h.id !== id) })
  }, [config, saveConfig])

  const setNorthStar = useCallback((text: string) => saveConfig({ ...config, northStar: text }), [config, saveConfig])
  const setWeekFocus = useCallback((text: string) => saveConfig({ ...config, weekFocus: text }), [config, saveConfig])

  const streak = (() => {
    let s = 0
    const d = new Date()
    d.setDate(d.getDate() - 1)
    for (let i = 0; i < 90; i++) {
      const key = d.toISOString().split('T')[0]
      const entry = log.find((e) => e.date === key)
      if (entry && (entry.completedIds.length > 0 || entry.choreDone)) { s++; d.setDate(d.getDate() - 1) }
      else break
    }
    return s
  })()

  const doneCount = todayHabits.filter((h) => isHabitDone(h.id)).length + (todayEntry.choreDone ? 1 : 0)
  const totalCount = todayHabits.length + 1

  const categoryDone = (cat: Habit['category']) =>
    todayHabits.filter((h) => h.category === cat && isHabitDone(h.id)).length
  const categoryTotal = (cat: Habit['category']) =>
    todayHabits.filter((h) => h.category === cat).length

  return {
    habits: config.habits,
    todayHabits,
    northStar: config.northStar,
    weekFocus: config.weekFocus,
    majorTask: todayEntry.majorTask,
    loading,
    isHabitDone,
    isChoreDone: todayEntry.choreDone,
    toggleHabit,
    toggleChore,
    setMajorTask,
    addHabit,
    deleteHabit,
    setNorthStar,
    setWeekFocus,
    streak,
    doneCount,
    totalCount,
    categoryDone,
    categoryTotal,
  }
}

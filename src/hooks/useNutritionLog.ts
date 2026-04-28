import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { DailyNutrition, Meal, FoodItem, MacroTotals } from '../types'

const DEFAULT_MEALS: Meal[] = [
  { id: 'breakfast', name: 'Breakfast', foods: [] },
  { id: 'lunch',     name: 'Lunch',     foods: [] },
  { id: 'dinner',    name: 'Dinner',    foods: [] },
  { id: 'snacks',    name: 'Snacks',    foods: [] },
]

const LS_KEY = 'nutrition_logs_v1'

function lsRead(): DailyNutrition[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as DailyNutrition[] }
  catch { return [] }
}

export function useNutritionLog() {
  const { user, isLocal } = useAuth()
  const [logs, setLogs] = useState<DailyNutrition[]>(isLocal ? lsRead() : [])
  const [loading, setLoading] = useState(!isLocal)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (isLocal) return
    if (!user) { setLogs([]); setLoading(false); return }

    supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setLogs((data ?? []).map(rowToEntry))
        setLoading(false)
      })
  }, [user, isLocal])

  const getByDate = useCallback(
    (date: string): DailyNutrition =>
      logs.find((l) => l.date === date) ?? { date, meals: DEFAULT_MEALS, waterOz: 0 },
    [logs]
  )

  const getTodayNutrition = useCallback(() => getByDate(today), [getByDate, today])

  const upsertDay = useCallback((entry: DailyNutrition) => {
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.date === entry.date)
      const next = idx >= 0
        ? prev.map((l, i) => i === idx ? entry : l)
        : [entry, ...prev]
      if (isLocal) localStorage.setItem(LS_KEY, JSON.stringify(next.slice(0, 90)))
      return next
    })
    if (!isLocal && user) {
      supabase.from('nutrition_logs').upsert(
        { user_id: user.id, date: entry.date, meals: entry.meals, water_oz: entry.waterOz },
        { onConflict: 'user_id,date' }
      )
    }
  }, [user, isLocal])

  const addFood = useCallback((date: string, mealId: string, food: FoodItem) => {
    const entry = getByDate(date)
    const meals = entry.meals.map((m) => m.id === mealId ? { ...m, foods: [...m.foods, food] } : m)
    upsertDay({ ...entry, meals })
  }, [getByDate, upsertDay])

  const deleteFood = useCallback((date: string, mealId: string, foodId: string) => {
    const entry = getByDate(date)
    const meals = entry.meals.map((m) => m.id === mealId ? { ...m, foods: m.foods.filter((f) => f.id !== foodId) } : m)
    upsertDay({ ...entry, meals })
  }, [getByDate, upsertDay])

  const updateWater = useCallback((date: string, oz: number) => {
    const entry = getByDate(date)
    upsertDay({ ...entry, waterOz: Math.max(0, oz) })
  }, [getByDate, upsertDay])

  const addMeal = useCallback((date: string, meal: Meal) => {
    const entry = getByDate(date)
    upsertDay({ ...entry, meals: [...entry.meals, meal] })
  }, [getByDate, upsertDay])

  const getDayTotals = useCallback((date: string): MacroTotals => {
    const entry = logs.find((l) => l.date === date)
    if (!entry) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return entry.meals.reduce(
      (acc, meal) => {
        meal.foods.forEach((f) => { acc.calories += f.calories; acc.protein += f.protein; acc.carbs += f.carbs; acc.fat += f.fat })
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [logs])

  return { logs, loading, today, getTodayNutrition, getByDate, upsertDay, addFood, deleteFood, updateWater, addMeal, getDayTotals }
}

function rowToEntry(row: Record<string, unknown>): DailyNutrition {
  return {
    date: row.date as string,
    meals: row.meals as Meal[],
    waterOz: row.water_oz as number,
  }
}

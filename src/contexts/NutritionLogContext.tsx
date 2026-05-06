import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { DailyNutrition, Meal, FoodItem, MacroTotals } from '../types'

const DEFAULT_MEALS: Meal[] = [
  { id: 'breakfast', name: 'Breakfast', foods: [] },
  { id: 'lunch',     name: 'Lunch',     foods: [] },
  { id: 'snacks',    name: 'Snacks',    foods: [] },
  { id: 'dinner',    name: 'Dinner',    foods: [] },
]

const MEAL_ID_ALIASES: Record<string, string> = {
  snack: 'snacks',
}

function normalizeMealId(mealId: string): string {
  return MEAL_ID_ALIASES[mealId] ?? mealId
}

function createEmptyDay(date: string): DailyNutrition {
  return {
    date,
    meals: DEFAULT_MEALS.map((meal) => ({ ...meal, foods: [] })),
    waterOz: 0,
  }
}

function getEntryByDate(logs: DailyNutrition[], date: string): DailyNutrition {
  return logs.find((l) => l.date === date) ?? createEmptyDay(date)
}

function normalizeMeals(meals: Meal[]): Meal[] {
  const mealsById = new Map<string, Meal>()

  DEFAULT_MEALS.forEach((meal) => {
    mealsById.set(meal.id, { ...meal, foods: [] })
  })

  meals.forEach((meal) => {
    const id = normalizeMealId(meal.id)
    const existing = mealsById.get(id)
    mealsById.set(id, existing
      ? { ...existing, ...meal, id, foods: [...existing.foods, ...meal.foods] }
      : { ...meal, id }
    )
  })

  return [
    ...DEFAULT_MEALS.map((meal) => mealsById.get(meal.id)!),
    ...Array.from(mealsById.values()).filter((meal) => !DEFAULT_MEALS.some((defaultMeal) => defaultMeal.id === meal.id)),
  ]
}

function replaceEntry(logs: DailyNutrition[], entry: DailyNutrition): DailyNutrition[] {
  const idx = logs.findIndex((l) => l.date === entry.date)
  if (idx >= 0) {
    const next = [...logs]
    next[idx] = entry
    return next
  }
  return [entry, ...logs]
}

function rowToEntry(row: Record<string, unknown>): DailyNutrition {
  return {
    date: row.date as string,
    meals: normalizeMeals(row.meals as Meal[]),
    waterOz: row.water_oz as number,
  }
}

interface NutritionLogContextValue {
  logs: DailyNutrition[]
  loading: boolean
  today: string
  refresh: () => void
  getTodayNutrition: () => DailyNutrition
  getByDate: (date: string) => DailyNutrition
  upsertDay: (entry: DailyNutrition) => Promise<void>
  addFood: (date: string, mealId: string, food: FoodItem) => void
  addFoods: (date: string, mealId: string, foods: FoodItem[]) => void
  deleteFood: (date: string, mealId: string, foodId: string) => void
  updateWater: (date: string, oz: number) => void
  addMeal: (date: string, meal: Meal) => void
  getDayTotals: (date: string) => MacroTotals
}

const NutritionLogContext = createContext<NutritionLogContextValue | null>(null)

export function NutritionLogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DailyNutrition[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const today = new Date().toISOString().split('T')[0]

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    if (!user) { setLogs([]); setLoading(false); return }
    setLoading(true)

    supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load nutrition logs', error)
          setLogs([])
          return
        }
        setLogs((data ?? []).map(rowToEntry))
      })
      .catch((error) => {
        console.error('Failed to load nutrition logs', error)
        setLogs([])
      })
      .finally(() => setLoading(false))
  }, [user, refreshKey])

  const getByDate = useCallback((date: string): DailyNutrition => getEntryByDate(logs, date), [logs])

  const getTodayNutrition = useCallback(() => getByDate(today), [getByDate, today])

  const persistDay = useCallback(async (entry: DailyNutrition) => {
    if (!user) return
    const { error } = await supabase
      .from('nutrition_logs')
      .upsert(
        { user_id: user.id, date: entry.date, meals: entry.meals, water_oz: entry.waterOz },
        { onConflict: 'user_id,date' }
      )
    if (error) {
      console.error('Failed to save nutrition day', error)
      return
    }
    refresh()
  }, [user, refresh])

  const upsertDay = useCallback(async (entry: DailyNutrition) => {
    setLogs((prev) => replaceEntry(prev, entry))
    await persistDay(entry)
  }, [persistDay])

  const updateDay = useCallback((date: string, updater: (entry: DailyNutrition) => DailyNutrition) => {
    let nextEntry: DailyNutrition | null = null
    setLogs((prev) => {
      const updated = updater(getEntryByDate(prev, date))
      nextEntry = updated
      return replaceEntry(prev, updated)
    })
    if (nextEntry) void persistDay(nextEntry)
  }, [persistDay])

  const addFoods = useCallback((date: string, mealId: string, foods: FoodItem[]) => {
    const normalizedMealId = normalizeMealId(mealId)
    updateDay(date, (entry) => ({
      ...entry,
      meals: entry.meals.map((m) => (
        m.id === normalizedMealId ? { ...m, foods: [...m.foods, ...foods] } : m
      )),
    }))
  }, [updateDay])

  const addFood = useCallback((date: string, mealId: string, food: FoodItem) => {
    addFoods(date, mealId, [food])
  }, [addFoods])

  const deleteFood = useCallback((date: string, mealId: string, foodId: string) => {
    const normalizedMealId = normalizeMealId(mealId)
    updateDay(date, (entry) => ({
      ...entry,
      meals: entry.meals.map((m) => (
        m.id === normalizedMealId ? { ...m, foods: m.foods.filter((f) => f.id !== foodId) } : m
      )),
    }))
  }, [updateDay])

  const updateWater = useCallback((date: string, oz: number) => {
    updateDay(date, (entry) => ({ ...entry, waterOz: Math.max(0, oz) }))
  }, [updateDay])

  const addMeal = useCallback((date: string, meal: Meal) => {
    updateDay(date, (entry) => ({ ...entry, meals: [...entry.meals, meal] }))
  }, [updateDay])

  const getDayTotals = useCallback((date: string): MacroTotals => {
    const entry = logs.find((l) => l.date === date)
    if (!entry) return { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 }
    return entry.meals.reduce(
      (acc, meal) => {
        meal.foods.forEach((f) => { acc.calories += f.calories; acc.protein += f.protein; acc.carbs += f.carbs; acc.fat += f.fat; acc.sugar += f.sugar ?? 0 })
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 }
    )
  }, [logs])

  return (
    <NutritionLogContext.Provider value={{
      logs, loading, today, refresh, getTodayNutrition, getByDate,
      upsertDay, addFood, addFoods, deleteFood, updateWater, addMeal, getDayTotals,
    }}>
      {children}
    </NutritionLogContext.Provider>
  )
}

export function useNutritionLog() {
  const ctx = useContext(NutritionLogContext)
  if (!ctx) throw new Error('useNutritionLog must be used within NutritionLogProvider')
  return ctx
}

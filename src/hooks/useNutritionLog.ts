import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { DailyNutrition, Meal, FoodItem, MacroTotals } from '../types'

export function useNutritionLog() {
  const [logs, setLogs] = useLocalStorage<DailyNutrition[]>('nutrition_logs', [])

  const today = new Date().toISOString().split('T')[0]

  const getByDate = useCallback(
    (date: string): DailyNutrition => {
      return (
        logs.find((l) => l.date === date) ?? {
          date,
          meals: [
            { id: 'breakfast', name: 'Breakfast', foods: [] },
            { id: 'lunch', name: 'Lunch', foods: [] },
            { id: 'dinner', name: 'Dinner', foods: [] },
            { id: 'snacks', name: 'Snacks', foods: [] },
          ],
          waterOz: 0,
        }
      )
    },
    [logs]
  )

  const getTodayNutrition = useCallback((): DailyNutrition => {
    return getByDate(today)
  }, [getByDate, today])

  const upsertDay = useCallback(
    (entry: DailyNutrition) => {
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.date === entry.date)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = entry
          return next
        }
        return [...prev, entry]
      })
    },
    [setLogs]
  )

  const addFood = useCallback(
    (date: string, mealId: string, food: FoodItem) => {
      const entry = getByDate(date)
      const meals = entry.meals.map((m) =>
        m.id === mealId ? { ...m, foods: [...m.foods, food] } : m
      )
      upsertDay({ ...entry, meals })
    },
    [getByDate, upsertDay]
  )

  const deleteFood = useCallback(
    (date: string, mealId: string, foodId: string) => {
      const entry = getByDate(date)
      const meals = entry.meals.map((m) =>
        m.id === mealId ? { ...m, foods: m.foods.filter((f) => f.id !== foodId) } : m
      )
      upsertDay({ ...entry, meals })
    },
    [getByDate, upsertDay]
  )

  const updateWater = useCallback(
    (date: string, oz: number) => {
      const entry = getByDate(date)
      upsertDay({ ...entry, waterOz: Math.max(0, oz) })
    },
    [getByDate, upsertDay]
  )

  const addMeal = useCallback(
    (date: string, meal: Meal) => {
      const entry = getByDate(date)
      upsertDay({ ...entry, meals: [...entry.meals, meal] })
    },
    [getByDate, upsertDay]
  )

  const getDayTotals = useCallback((date: string): MacroTotals => {
    const entry = logs.find((l) => l.date === date)
    if (!entry) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return entry.meals.reduce(
      (acc, meal) => {
        meal.foods.forEach((f) => {
          acc.calories += f.calories
          acc.protein += f.protein
          acc.carbs += f.carbs
          acc.fat += f.fat
        })
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [logs])

  return {
    logs,
    today,
    getTodayNutrition,
    getByDate,
    upsertDay,
    addFood,
    deleteFood,
    updateWater,
    addMeal,
    getDayTotals,
  }
}

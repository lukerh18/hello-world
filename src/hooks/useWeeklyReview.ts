import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { NUTRITION_TARGETS } from '../data/userProfile'
import { OVERLOAD_EXERCISE_NAMES } from '../data/progressiveOverload'
import type { DailyNutrition, WorkoutLog, BodyMetrics, OverloadKey } from '../types'

function getMondayOfWeek(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function buildContext(
  healthContext: string,
  weekNumber: number,
  phase: string,
  latestWeight: number,
  metrics: BodyMetrics,
  workoutLogs: WorkoutLog[],
  nutritionLogs: DailyNutrition[]
): object {
  const lbsToGoal = Math.max(0, latestWeight - 185)
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentWeights = metrics.weightLog
    .filter((e) => new Date(e.date + 'T12:00:00') >= sevenDaysAgo)
    .map((e) => ({ date: e.date, weight: e.weight }))

  const weekWorkouts = workoutLogs
    .filter((w) => w.completedAt && new Date(w.date) >= sevenDaysAgo)
    .sort((a, b) => a.date.localeCompare(b.date))

  const recentNutrition = nutritionLogs.filter((n) => new Date(n.date + 'T12:00:00') >= sevenDaysAgo)
  const nutritionAvg = recentNutrition.length > 0
    ? (() => {
        const sum = (fn: (n: DailyNutrition) => number) =>
          Math.round(recentNutrition.reduce((s, n) => s + fn(n), 0) / recentNutrition.length)
        const field = (n: DailyNutrition, f: 'calories' | 'protein' | 'carbs' | 'fat') =>
          n.meals.reduce((ms, m) => ms + m.foods.reduce((fs, food) => fs + food[f], 0), 0)
        return {
          calories: sum((n) => field(n, 'calories')),
          protein: sum((n) => field(n, 'protein')),
          carbs: sum((n) => field(n, 'carbs')),
          fat: sum((n) => field(n, 'fat')),
          targets: NUTRITION_TARGETS,
        }
      })()
    : null

  const strengthMaxes = (Object.keys(OVERLOAD_EXERCISE_NAMES) as OverloadKey[])
    .reduce<Record<string, number>>((acc, key) => {
      const weights = workoutLogs
        .flatMap((w) => w.exercises.filter((e) => e.exerciseId === key).flatMap((e) => e.sets))
        .filter((s) => s.completed && s.weight > 0).map((s) => s.weight)
      if (weights.length > 0) acc[OVERLOAD_EXERCISE_NAMES[key]] = Math.max(...weights)
      return acc
    }, {})

  return {
    healthContext,
    programStatus: { weekNumber, phase, currentWeight: latestWeight, goalWeight: 185, lbsToGoal },
    recentWeights,
    weekWorkouts,
    strengthMaxes,
    nutritionAvg,
  }
}

export function useWeeklyReview(
  healthContext: string,
  weekNumber: number,
  phase: string,
  latestWeight: number,
  metrics: BodyMetrics,
  workoutLogs: WorkoutLog[],
  nutritionLogs: DailyNutrition[]
) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [review, setReview] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  // Load cached review for this week from Supabase
  const loadCache = useCallback(async () => {
    if (!session) return
    const weekStart = getMondayOfWeek()
    const { data } = await supabase
      .from('weekly_review_cache')
      .select('review_text, generated_at')
      .eq('week_start', weekStart)
      .maybeSingle()
    if (data) {
      setReview(data.review_text as string)
      setGeneratedAt(data.generated_at as string)
    }
  }, [session])

  const generate = useCallback(async () => {
    if (!session) { setError('Not signed in'); return }
    setLoading(true)
    setError(null)
    try {
      const context = buildContext(healthContext, weekNumber, phase, latestWeight, metrics, workoutLogs, nutritionLogs)
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('weekly-review', {
        body: context,
      })
      if (fnErr) throw new Error(fnErr.message)
      const text: string = fnData.review
      const weekStart = getMondayOfWeek()
      await supabase.from('weekly_review_cache').upsert(
        { week_start: weekStart, review_text: text, generated_at: new Date().toISOString() },
        { onConflict: 'user_id,week_start' }
      )
      setReview(text)
      setGeneratedAt(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate review')
    } finally {
      setLoading(false)
    }
  }, [session, healthContext, weekNumber, phase, latestWeight, metrics, workoutLogs, nutritionLogs])

  return { review, generatedAt, loading, error, generate, loadCache }
}

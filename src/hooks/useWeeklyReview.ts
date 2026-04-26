import { useState, useCallback } from 'react'
import { NUTRITION_TARGETS } from '../data/userProfile'
import { OVERLOAD_EXERCISE_NAMES } from '../data/progressiveOverload'
import type { DailyNutrition, WorkoutLog, BodyMetrics, OverloadKey } from '../types'

interface ReviewCache {
  weekStart: string
  text: string
  generatedAt: string
}

const CACHE_KEY = 'weekly_review_cache'

function getMondayOfWeek(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function buildPrompt(
  apiKey: string,
  healthContext: string,
  weekNumber: number,
  phase: string,
  latestWeight: number
): string {
  let metrics: BodyMetrics = { weightLog: [], measurements: [] }
  let workoutLogs: WorkoutLog[] = []
  let nutritionLogs: DailyNutrition[] = []

  try {
    metrics = JSON.parse(localStorage.getItem('body_metrics') ?? '{"weightLog":[],"measurements":[]}')
    workoutLogs = JSON.parse(localStorage.getItem('workout_logs') ?? '[]')
    nutritionLogs = JSON.parse(localStorage.getItem('nutrition_logs') ?? '[]')
  } catch { /* use defaults */ }

  const lbsToGoal = Math.max(0, latestWeight - 185)

  // Last 7 days weight entries
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentWeights = metrics.weightLog
    .filter((e) => new Date(e.date + 'T12:00:00') >= sevenDaysAgo)
    .map((e) => `  ${new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${e.weight} lbs`)
    .join('\n') || '  No weigh-ins this week'

  // This week's workouts
  const weekWorkouts = workoutLogs
    .filter((w) => w.completedAt && new Date(w.date) >= sevenDaysAgo)
    .sort((a, b) => a.date.localeCompare(b.date))

  const workoutSummary = weekWorkouts.length === 0
    ? '  No workouts logged this week'
    : weekWorkouts.map((log) => {
        const d = new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        const exercises = log.exercises.map((ex) => {
          const done = ex.sets.filter((s) => s.completed)
          const weights = done.map((s) => s.weight).filter((w) => w > 0)
          const maxW = weights.length > 0 ? Math.max(...weights) : 0
          return `    • ${ex.exerciseName}: ${done.length}×${done[0]?.reps ?? '?'}${maxW > 0 ? ` @ ${maxW} lbs` : ''}`
        }).join('\n')
        return `  ${d} (Week ${log.programWeek})\n${exercises}`
      }).join('\n\n')

  // 7-day nutrition averages
  const recentNutrition = nutritionLogs.filter((n) => new Date(n.date + 'T12:00:00') >= sevenDaysAgo)
  let nutritionSummary = '  No nutrition data logged this week'
  if (recentNutrition.length > 0) {
    const avg = (fn: (n: DailyNutrition) => number) =>
      Math.round(recentNutrition.reduce((s, n) => s + fn(n), 0) / recentNutrition.length)
    const sumField = (n: DailyNutrition, f: 'calories' | 'protein' | 'carbs' | 'fat') =>
      n.meals.reduce((ms, m) => ms + m.foods.reduce((fs, food) => fs + food[f], 0), 0)
    const avgCal  = avg((n) => sumField(n, 'calories'))
    const avgProt = avg((n) => sumField(n, 'protein'))
    const avgCarb = avg((n) => sumField(n, 'carbs'))
    const avgFat  = avg((n) => sumField(n, 'fat'))
    const calPct  = Math.round(avgCal / NUTRITION_TARGETS.calories * 100)
    const protPct = Math.round(avgProt / NUTRITION_TARGETS.protein * 100)
    nutritionSummary = `  Calories: ${avgCal}/${NUTRITION_TARGETS.calories} (${calPct}%) | Protein: ${avgProt}g/${NUTRITION_TARGETS.protein}g (${protPct}%) | Carbs: ${avgCarb}g | Fat: ${avgFat}g`
  }

  // Strength PRs for context
  const prLines = (Object.keys(OVERLOAD_EXERCISE_NAMES) as OverloadKey[])
    .map((key) => {
      const allW = workoutLogs
        .flatMap((w) => w.exercises.filter((e) => e.exerciseId === key).flatMap((e) => e.sets))
        .filter((s) => s.completed && s.weight > 0).map((s) => s.weight)
      if (allW.length === 0) return null
      return `  ${OVERLOAD_EXERCISE_NAMES[key]}: max ${Math.max(...allW)} lbs`
    })
    .filter(Boolean)
    .join('\n') || '  No strength data yet'

  return `You are an expert performance coach with deep knowledge of modern sports science (Huberman, Attia, Galpin, Israetel). Analyze this week's data for Luke and write a focused, specific weekly review.

HEALTH CONTEXT:
${healthContext || '  Not provided'}

PROGRAM STATUS:
  Week ${weekNumber} of 12 · ${phase} Phase
  Current: ${latestWeight} lbs → Goal: 185 lbs (${lbsToGoal > 0 ? `${lbsToGoal} lbs remaining` : 'GOAL REACHED'})

WEIGHT THIS WEEK:
${recentWeights}

WORKOUTS THIS WEEK:
${workoutSummary}

CURRENT STRENGTH MAXES:
${prLines}

NUTRITION (7-day avg):
${nutritionSummary}

Respond with EXACTLY these four sections using ### headers. Be specific to the numbers above — no generic advice. Max 300 words total.

### What's Working
2-3 specific observations backed by the data

### Needs Attention
2-3 specific gaps or issues from the data

### This Week's Priority
One clear, actionable focus for the coming week

### Science-Based Insight
One evidence-based recommendation directly relevant to Luke's current data, goals, or health context`
}

export function useWeeklyReview(apiKey: string, healthContext: string, weekNumber: number, phase: string, latestWeight: number) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCached = (): ReviewCache | null => {
    try {
      const cached: ReviewCache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
      return cached?.weekStart === getMondayOfWeek() ? cached : null
    } catch { return null }
  }

  const [cache, setCache] = useState<ReviewCache | null>(() => getCached())

  const generate = useCallback(async () => {
    if (!apiKey) { setError('Add your Anthropic API key in Settings to generate a review.'); return }
    setLoading(true)
    setError(null)
    try {
      const prompt = buildPrompt(apiKey, healthContext, weekNumber, phase, latestWeight)
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: { message?: string } }).error?.message ?? `API error ${res.status}`)
      }
      const data = await res.json()
      const text: string = data.content?.[0]?.text ?? ''
      const newCache: ReviewCache = { weekStart: getMondayOfWeek(), text, generatedAt: new Date().toISOString() }
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache))
      setCache(newCache)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate review')
    } finally {
      setLoading(false)
    }
  }, [apiKey, healthContext, weekNumber, phase, latestWeight])

  return { review: cache?.text ?? null, generatedAt: cache?.generatedAt ?? null, loading, error, generate }
}

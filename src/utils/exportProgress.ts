import { NUTRITION_TARGETS } from '../data/userProfile'
import { OVERLOAD_EXERCISE_NAMES } from '../data/progressiveOverload'
import type { DailyNutrition, WorkoutLog, BodyMetrics, OverloadKey } from '../types'

interface ExportInput {
  startDate: string
  metrics: BodyMetrics
  workoutLogs: WorkoutLog[]
  nutritionLogs: DailyNutrition[]
}

export function generateProgressExport(input: ExportInput): string {
  const { startDate, metrics, workoutLogs, nutritionLogs } = input
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const weekNumber = startDate
    ? Math.max(1, Math.min(12, Math.ceil((Date.now() - new Date(startDate).getTime()) / (7 * 86400000))))
    : 1

  const latestWeight = metrics.weightLog.at(-1)?.weight ?? 196
  const lbsLost = 196 - latestWeight
  const lbsToGoal = Math.max(0, latestWeight - 185)

  const lines: string[] = []

  lines.push(`# Luke's Fitness Progress Report`)
  lines.push(`*Generated ${today}*`)
  lines.push('')

  lines.push('## Current Program Status')
  lines.push(`- Week ${weekNumber} of 12`)
  lines.push(`- Weight: ${latestWeight} lbs (started 196 lbs, goal 185 lbs)`)
  lines.push(`- Lost: ${lbsLost >= 0 ? lbsLost.toFixed(1) : '0'} lbs · Remaining: ${lbsToGoal} lbs · Target: July 2026`)
  lines.push('')

  if (metrics.weightLog.length > 0) {
    lines.push('## Weight History (most recent first)')
    metrics.weightLog
      .slice(-14)
      .reverse()
      .forEach((e) => {
        const d = new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        lines.push(`- ${d}: ${e.weight} lbs`)
      })
    lines.push('')
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 28)
  const recentWorkouts = workoutLogs
    .filter((w) => w.completedAt && new Date(w.date) >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)

  if (recentWorkouts.length > 0) {
    lines.push('## Recent Workouts (Last 4 Weeks)')
    recentWorkouts.forEach((log) => {
      const d = new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      const dayLabel = log.exercises[0]?.exerciseName ? log.exercises.map((e) => e.exerciseName.split(' ')[0]).slice(0, 2).join('/') : 'Workout'
      lines.push(`\n**${d} – ${dayLabel} (Week ${log.programWeek})**`)
      log.exercises.forEach((ex) => {
        const done = ex.sets.filter((s) => s.completed)
        if (done.length === 0) return
        const weights = done.map((s) => s.weight).filter((w) => w > 0)
        const maxW = weights.length > 0 ? Math.max(...weights) : 0
        const setStr = `${done.length}×${done[0]?.reps ?? '?'}${maxW > 0 ? ` @ ${maxW} lbs` : ''}`
        lines.push(`- ${ex.exerciseName}: ${setStr}`)
      })
    })
    lines.push('')
  }

  const trackedKeys = Object.keys(OVERLOAD_EXERCISE_NAMES) as OverloadKey[]
  const prLines: string[] = []

  trackedKeys.forEach((key) => {
    const weights = workoutLogs
      .flatMap((w) => w.exercises.filter((e) => e.exerciseId === key).flatMap((e) => e.sets))
      .filter((s) => s.completed && s.weight > 0)
      .map((s) => s.weight)
    if (weights.length === 0) return
    const first = weights[0]
    const max = Math.max(...weights)
    prLines.push(`- ${OVERLOAD_EXERCISE_NAMES[key]}: ${first} → ${max} lbs${max > first ? ` (+${max - first})` : ''}`)
  })

  if (prLines.length > 0) {
    lines.push('## Strength Progression (First Logged → Current Max)')
    lines.push(...prLines)
    lines.push('')
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentNutrition = nutritionLogs.filter((n) => new Date(n.date + 'T12:00:00') >= sevenDaysAgo)

  if (recentNutrition.length > 0) {
    const avg = (getter: (n: DailyNutrition) => number) =>
      Math.round(recentNutrition.reduce((sum, n) => sum + getter(n), 0) / recentNutrition.length)

    const sumFoods = (n: DailyNutrition, field: 'calories' | 'protein' | 'carbs' | 'fat') =>
      n.meals.reduce((ms, m) => ms + m.foods.reduce((fs, f) => fs + f[field], 0), 0)

    const avgCal  = avg((n) => sumFoods(n, 'calories'))
    const avgProt = avg((n) => sumFoods(n, 'protein'))
    const avgCarb = avg((n) => sumFoods(n, 'carbs'))
    const avgFat  = avg((n) => sumFoods(n, 'fat'))

    lines.push(`## Nutrition (${recentNutrition.length}-Day Average)`)
    lines.push(`- Calories: ${avgCal} / ${NUTRITION_TARGETS.calories} target (${Math.round(avgCal / NUTRITION_TARGETS.calories * 100)}%)`)
    lines.push(`- Protein:  ${avgProt}g / ${NUTRITION_TARGETS.protein}g target`)
    lines.push(`- Carbs:    ${avgCarb}g / ${NUTRITION_TARGETS.carbs}g target`)
    lines.push(`- Fat:      ${avgFat}g / ${NUTRITION_TARGETS.fat}g target`)
    lines.push('')
  }

  lines.push('## Context for AI Coach')
  lines.push(`12-week Push/Pull/Legs progressive overload program. Equipment: Tonal, kettlebells, treadmill, bike.`)
  lines.push(`Luke is 6'2", started at 196 lbs, goal is 185 lbs by July 2026. Currently Week ${weekNumber}, ${latestWeight} lbs.`)
  lines.push(`Please review the data above and suggest specific adjustments to optimize fat loss while preserving muscle.`)

  return lines.join('\n')
}

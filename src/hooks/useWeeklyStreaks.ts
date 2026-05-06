import { useEffect, useMemo, useState } from 'react'
import { getWorkoutForDay } from '../data/program'
import { DEFAULT_USER_PROFILE, NUTRITION_TARGETS } from '../data/userProfile'
import { getDefaultMovementPlanForDate } from './useMovementPlan'
import { useMovementLog } from './useMovementLog'
import {
  FASTING_ABSTAIN_UPDATED_EVENT,
  getFastingAbstainDay,
  getFastingAbstainScore,
  isFastingAbstainComplete,
} from './useFastingAbstain'
import { useBodyMetrics } from './useBodyMetrics'
import type { DayOfWeek, MacroTotals, WorkoutLog } from '../types'

export type StreakLaneId = 'fuel' | 'abstain' | 'move'
export type StreakDayStatus = 'complete' | 'protected_miss' | 'missed' | 'pending' | 'at_risk'

export interface StreakDay {
  date: string
  label: string
  status: StreakDayStatus
}

export interface WeeklyStreakLane {
  id: StreakLaneId
  title: string
  requirement: string
  href: string
  days: StreakDay[]
  todayStatus: StreakDayStatus
  completedCount: number
  protectedMissUsed: boolean
  broken: boolean
  detail: string
  secondaryDetail?: string
  nextAction: string
  score: number
  maxScore: number
}

interface UseWeeklyStreaksOptions {
  getDayTotals: (date: string) => MacroTotals
  getLogByDate: (date: string) => WorkoutLog | undefined
  loading?: boolean
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAYS: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const SUMMER_TARGET_DATE = DEFAULT_USER_PROFILE.goalDate || '2026-07-31'

function dateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function todayKey(): string {
  return dateKey(new Date())
}

function getWeekDates(today: string): string[] {
  const current = new Date(`${today}T12:00:00`)
  const mondayOffset = (current.getDay() + 6) % 7
  const monday = new Date(current)
  monday.setDate(current.getDate() - mondayOffset)

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)
    return dateKey(day)
  })
}

function getDayOfWeek(date: string): DayOfWeek {
  return DAYS[new Date(`${date}T12:00:00`).getDay()]
}

function buildLaneDays(
  dates: string[],
  today: string,
  isComplete: (date: string) => boolean
): StreakDay[] {
  let protectedMissUsed = false

  return dates.map((date, index) => {
    if (date > today) {
      return { date, label: DAY_LABELS[index], status: 'pending' }
    }

    if (isComplete(date)) {
      return { date, label: DAY_LABELS[index], status: 'complete' }
    }

    if (date === today) {
      return {
        date,
        label: DAY_LABELS[index],
        status: protectedMissUsed ? 'at_risk' : 'pending',
      }
    }

    if (!protectedMissUsed) {
      protectedMissUsed = true
      return { date, label: DAY_LABELS[index], status: 'protected_miss' }
    }

    return { date, label: DAY_LABELS[index], status: 'missed' }
  })
}

function summarizeLane(days: StreakDay[]) {
  return {
    completedCount: days.filter((day) => day.status === 'complete').length,
    protectedMissUsed: days.some((day) => day.status === 'protected_miss'),
    broken: days.some((day) => day.status === 'missed'),
  }
}

function isNutritionComplete(totals: MacroTotals): boolean {
  return (
    totals.calories > 0 &&
    totals.calories <= NUTRITION_TARGETS.calories &&
    totals.carbs <= NUTRITION_TARGETS.carbs
  )
}

function getFuelScore(totals: MacroTotals): number {
  const caloriePoints = totals.calories > 0 && totals.calories <= NUTRITION_TARGETS.calories ? 20 : 0
  const carbPoints = totals.carbs > 0 && totals.carbs <= NUTRITION_TARGETS.carbs ? 15 : 0
  const proteinRatio = Math.min(1, totals.protein / NUTRITION_TARGETS.protein)
  const proteinPoints = Math.round(proteinRatio * 10)
  return caloriePoints + carbPoints + proteinPoints
}

function isMoveComplete(
  date: string,
  getLogByDate: (date: string) => WorkoutLog | undefined,
  getSummaryForDate: ReturnType<typeof useMovementLog>['getSummaryForDate']
): boolean {
  const workout = getWorkoutForDay(getDayOfWeek(date))
  const workoutComplete = Boolean(getLogByDate(date)?.completedAt)
  const plan = getDefaultMovementPlanForDate(date)
  const summary = getSummaryForDate(date)
  const movementComplete = summary.breaks >= plan.targetBreaks || summary.minutes >= plan.targetMinutes

  return workout.isRest ? movementComplete : workoutComplete || movementComplete
}

function getMoveScore(date: string, getLogByDate: (date: string) => WorkoutLog | undefined, getSummaryForDate: ReturnType<typeof useMovementLog>['getSummaryForDate']): number {
  const workout = getWorkoutForDay(getDayOfWeek(date))
  const workoutComplete = Boolean(getLogByDate(date)?.completedAt)
  const plan = getDefaultMovementPlanForDate(date)
  const summary = getSummaryForDate(date)
  const planComplete = workout.isRest ? summary.minutes >= plan.targetMinutes : workoutComplete
  const baselineComplete = summary.breaks >= Math.min(2, plan.targetBreaks) || summary.minutes >= Math.min(15, plan.targetMinutes)

  return (planComplete ? 20 : 0) + (baselineComplete ? 10 : 0)
}

function getDaysUntilTarget(today: string): number {
  const start = new Date(`${today}T12:00:00`)
  const target = new Date(`${SUMMER_TARGET_DATE}T12:00:00`)
  return Math.max(0, Math.ceil((target.getTime() - start.getTime()) / 86400000))
}

export function useWeeklyStreaks({
  getDayTotals,
  getLogByDate,
  loading = false,
}: UseWeeklyStreaksOptions) {
  const today = todayKey()
  const weekDates = useMemo(() => getWeekDates(today), [today])
  const { getSummaryForDate } = useMovementLog(today)
  const { latestWeight } = useBodyMetrics()
  const [fastingVersion, setFastingVersion] = useState(0)

  useEffect(() => {
    const refresh = () => setFastingVersion((version) => version + 1)
    window.addEventListener(FASTING_ABSTAIN_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(FASTING_ABSTAIN_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const lanes = useMemo<WeeklyStreakLane[]>(() => {
    const todayTotals = getDayTotals(today)
    const todayFasting = getFastingAbstainDay(today)
    const todayMovementPlan = getDefaultMovementPlanForDate(today)
    const todayMovementSummary = getSummaryForDate(today)
    const todayWorkout = getLogByDate(today)

    const fuelDays = buildLaneDays(weekDates, today, (date) => isNutritionComplete(getDayTotals(date)))
    const abstainDays = buildLaneDays(weekDates, today, (date) => isFastingAbstainComplete(getFastingAbstainDay(date)))
    const moveDays = buildLaneDays(weekDates, today, (date) => isMoveComplete(date, getLogByDate, getSummaryForDate))

    const fuelSummary = summarizeLane(fuelDays)
    const abstainSummary = summarizeLane(abstainDays)
    const moveSummary = summarizeLane(moveDays)
    const proteinHit = todayTotals.protein >= NUTRITION_TARGETS.protein
    const movementCompleteByWorkout = Boolean(todayWorkout?.completedAt)
    const fuelScore = getFuelScore(todayTotals)
    const abstainScore = getFastingAbstainScore(todayFasting)
    const moveScore = getMoveScore(today, getLogByDate, getSummaryForDate)

    return [
      {
        id: 'fuel',
        title: 'Fuel',
        requirement: 'Calories + carbs in target',
        href: '/nutrition',
        days: fuelDays,
        todayStatus: fuelDays.find((day) => day.date === today)?.status ?? 'pending',
        ...fuelSummary,
        detail: `${Math.round(todayTotals.calories)}/${NUTRITION_TARGETS.calories} kcal · ${Math.round(todayTotals.carbs)}/${NUTRITION_TARGETS.carbs}g carbs`,
        secondaryDetail: proteinHit
          ? `Protein hit: ${Math.round(todayTotals.protein)}g`
          : `Protein: ${Math.round(todayTotals.protein)}/${NUTRITION_TARGETS.protein}g`,
        nextAction: isNutritionComplete(todayTotals) ? 'Nutrition locked' : 'Log food',
        score: fuelScore,
        maxScore: 45,
      },
      {
        id: 'abstain',
        title: 'Fasting / Abstain',
        requirement: 'Kitchen closed + abstain rules',
        href: '/',
        days: abstainDays,
        todayStatus: abstainDays.find((day) => day.date === today)?.status ?? 'pending',
        ...abstainSummary,
        detail: `Window ${todayFasting.firstMealTime}-${todayFasting.lastMealTime}`,
        secondaryDetail: todayFasting.kitchenClosed
          ? 'Kitchen closed around 6pm'
          : 'Close the kitchen around 6pm',
        nextAction: isFastingAbstainComplete(todayFasting) ? 'Abstain locked' : 'Check abstain',
        score: abstainScore,
        maxScore: 25,
      },
      {
        id: 'move',
        title: 'Move',
        requirement: 'Workout or planned movement',
        href: '/workout?tab=move',
        days: moveDays,
        todayStatus: moveDays.find((day) => day.date === today)?.status ?? 'pending',
        ...moveSummary,
        detail: movementCompleteByWorkout
          ? 'Workout complete'
          : `${todayMovementSummary.breaks}/${todayMovementPlan.targetBreaks} breaks · ${todayMovementSummary.minutes}/${todayMovementPlan.targetMinutes} min`,
        secondaryDetail:
          todayMovementPlan.mode === 'heavy_workout' ? 'Heavy workout day' : 'Light movement day',
        nextAction:
          moveDays.find((day) => day.date === today)?.status === 'complete'
            ? 'Movement done'
            : 'Log movement',
        score: moveScore,
        maxScore: 30,
      },
    ]
  }, [fastingVersion, getDayTotals, getLogByDate, getSummaryForDate, today, weekDates])

  const focusLane =
    lanes.find((lane) => lane.todayStatus === 'at_risk') ??
    lanes.find((lane) => lane.todayStatus === 'pending') ??
    lanes.find((lane) => !lane.broken) ??
    lanes[0]

  return {
    loading,
    today,
    weekDates,
    lanes,
    focusLane,
    score: lanes.reduce((sum, lane) => sum + lane.score, 0),
    maxScore: lanes.reduce((sum, lane) => sum + lane.maxScore, 0),
    countdown: {
      targetDate: SUMMER_TARGET_DATE,
      daysRemaining: getDaysUntilTarget(today),
      currentWeight: latestWeight,
      targetWeight: DEFAULT_USER_PROFILE.goalWeightLbs,
      poundsRemaining: Math.max(0, latestWeight - DEFAULT_USER_PROFILE.goalWeightLbs),
      requiredWeeklyPace:
        getDaysUntilTarget(today) > 0
          ? Math.max(0, latestWeight - DEFAULT_USER_PROFILE.goalWeightLbs) / (getDaysUntilTarget(today) / 7)
          : 0,
    },
  }
}

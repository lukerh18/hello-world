import { useCallback, useMemo } from 'react'
import { getWorkoutForDay } from '../data/program'
import { useLocalStorage } from './useLocalStorage'
import type { DayOfWeek, MovementDayMode, MovementDayPlan } from '../types'

type MovementTargetSet = Pick<MovementDayPlan, 'targetBreaks' | 'targetMinutes' | 'targetReps'>

interface MovementPlanSettings {
  quietByDate: Record<string, string | undefined>
  targets: Record<MovementDayMode, MovementTargetSet>
}

const STORAGE_KEY = 'movement_plan_settings_v1'

const DEFAULT_SETTINGS: MovementPlanSettings = {
  quietByDate: {},
  targets: {
    heavy_workout: {
      targetBreaks: 3,
      targetMinutes: 20,
      targetReps: 50,
    },
    light_movement: {
      targetBreaks: 4,
      targetMinutes: 45,
      targetReps: 80,
    },
  },
}

const DAYS: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function getDayOfWeek(date: string): DayOfWeek {
  return DAYS[new Date(`${date}T12:00:00`).getDay()]
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getMovementModeForDate(date: string): Pick<MovementDayPlan, 'mode' | 'modeSource' | 'modeReason'> {
  const workout = getWorkoutForDay(getDayOfWeek(date))
  const hasStrengthWork = workout.exercises.some(
    (exercise) => exercise.equipment.includes('tonal') || exercise.hasProgressiveOverload
  )

  if (hasStrengthWork && !workout.isRest) {
    return {
      mode: 'heavy_workout',
      modeSource: 'workout_plan',
      modeReason: `${workout.label} includes strength work, so movement snacks stay low-friction.`,
    }
  }

  return {
    mode: 'light_movement',
    modeSource: workout ? 'workout_plan' : 'default',
    modeReason: workout.isRest
      ? 'Rest day from the workout plan, so light walks and mobility become the Body focus.'
      : `${workout.label} is lighter recovery work, so longer walks and mobility fit today.`,
  }
}

export function getDefaultMovementPlanForDate(
  date: string,
  settings: MovementPlanSettings = DEFAULT_SETTINGS
): MovementDayPlan {
  const modeInfo = getMovementModeForDate(date)
  const targets = settings.targets[modeInfo.mode] ?? DEFAULT_SETTINGS.targets[modeInfo.mode]

  return {
    date,
    ...modeInfo,
    ...targets,
    quietUntil: settings.quietByDate[date],
  }
}

export function useMovementPlan(date = getToday()) {
  const [settings, setSettings] = useLocalStorage<MovementPlanSettings>(STORAGE_KEY, DEFAULT_SETTINGS)

  const modeInfo = useMemo(() => getMovementModeForDate(date), [date])
  const plan = useMemo(() => getDefaultMovementPlanForDate(date, settings), [date, settings])

  const setQuietUntil = useCallback(
    (time?: string) => {
      setSettings((prev) => ({
        ...prev,
        quietByDate: {
          ...prev.quietByDate,
          [date]: time,
        },
      }))
    },
    [date, setSettings]
  )

  const updateTargets = useCallback(
    (targetUpdate: Partial<MovementTargetSet>) => {
      setSettings((prev) => ({
        ...prev,
        targets: {
          ...prev.targets,
          [modeInfo.mode]: {
            ...(prev.targets[modeInfo.mode] ?? DEFAULT_SETTINGS.targets[modeInfo.mode]),
            ...targetUpdate,
          },
        },
      }))
    },
    [modeInfo.mode, setSettings]
  )

  const isQuietNow = Boolean(plan.quietUntil && date === getToday() && plan.quietUntil > new Date().toTimeString().slice(0, 5))

  return {
    plan,
    isQuietNow,
    setQuietUntil,
    updateTargets,
  }
}

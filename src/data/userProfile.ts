import type { UserProfile, NutritionTargets } from '../types'

export const NUTRITION_TARGETS: NutritionTargets = {
  calories: 2537,
  protein: 185,
  carbs: 289,
  fat: 71,
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Luke',
  heightIn: 74,
  startingWeightLbs: 196,
  goalWeightLbs: 185,
  goalDate: '2026-07-31',
  programStartDate: new Date().toISOString().split('T')[0],
  nutritionTargets: NUTRITION_TARGETS,
}

export const WARMUP_NOTE =
  '5 min treadmill (3.5 mph) + arm circles, leg swings, hip circles, band pull-aparts'

export const REST_PERIODS = {
  compound: '90-120 sec',
  isolation: '60-90 sec',
  superset: '45-60 sec',
}

export const TEMPO_NOTE = '2 sec concentric · 1 sec pause · 3 sec eccentric'

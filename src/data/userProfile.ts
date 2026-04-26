import type { UserProfile, NutritionTargets } from '../types'

// Targets from Perplexity plan (Jan 2026): Mifflin-St Jeor + 1.375 multiplier - 500 kcal deficit
// Priority: LDL reduction via soluble fiber + omega-3s; high protein to counter Zoloft appetite effects
export const NUTRITION_TARGETS: NutritionTargets = {
  calories: 2100,
  protein: 200,
  carbs: 190,
  fat: 60,
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

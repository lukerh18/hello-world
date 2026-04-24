// ─── Program / Schedule ───────────────────────────────────────────────────────

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type Phase = 'foundation' | 'growth' | 'peak' | 'deload'

export type Equipment = 'tonal' | 'kettlebell' | 'treadmill' | 'bike' | 'bodyweight'

export interface ExerciseDefinition {
  id: string
  name: string
  equipment: Equipment[]
  defaultSets: number
  repRange: [number, number]
  repUnit?: 'reps' | 'seconds' | 'minutes'
  hasProgressiveOverload: boolean
  notes?: string
}

export interface WorkoutDay {
  day: DayOfWeek
  label: string
  focusLabel: string
  exercises: ExerciseDefinition[]
  includesCardio: boolean
  isRest: boolean
}

export interface PhaseConfig {
  phase: Phase
  weeks: [number, number]
  label: string
  color: string
  bgColor: string
  compoundRepRange: [number, number]
  isolationRepRange: [number, number]
  intensityMultiplier: number
  description: string
}

// ─── Progressive Overload ─────────────────────────────────────────────────────

export type OverloadKey =
  | 'chest-press'
  | 'oh-press'
  | 'lat-pulldown'
  | 'cable-row'
  | 'goblet-squat'
  | 'rdl'
  | 'deadlift'

export type ProgressiveOverloadTable = Record<OverloadKey, Record<number, number>>

// ─── Workout Logging ──────────────────────────────────────────────────────────

export interface SetLog {
  setNumber: number
  weight: number
  reps: number
  completed: boolean
  rpe?: number
}

export interface ExerciseLog {
  exerciseId: string
  exerciseName: string
  sets: SetLog[]
  targetWeight?: number
}

export interface WorkoutLog {
  id: string
  date: string
  dayOfWeek: DayOfWeek
  phase: Phase
  programWeek: number
  exercises: ExerciseLog[]
  startedAt?: string
  completedAt?: string
  notes?: string
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize?: string
}

export interface Meal {
  id: string
  name: string
  time?: string
  foods: FoodItem[]
}

export interface DailyNutrition {
  date: string
  meals: Meal[]
  waterOz: number
}

export interface NutritionTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

// ─── Body Metrics ─────────────────────────────────────────────────────────────

export interface WeightEntry {
  date: string
  weight: number
}

export interface BodyMeasurements {
  date: string
  chest?: number
  waist?: number
  arms?: number
  thighs?: number
  bodyFat?: number
}

export interface BodyMetrics {
  weightLog: WeightEntry[]
  measurements: BodyMeasurements[]
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string
  heightIn: number
  startingWeightLbs: number
  goalWeightLbs: number
  goalDate: string
  programStartDate: string
  nutritionTargets: NutritionTargets
}

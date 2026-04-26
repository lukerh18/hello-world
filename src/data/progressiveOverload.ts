import type { OverloadKey, ProgressiveOverloadTable } from '../types'

export const OVERLOAD_TABLE: ProgressiveOverloadTable = {
  'chest-press':  { 1: 60, 2: 60, 3: 65, 4: 65, 5: 70, 6: 70, 7: 75, 8: 75, 9: 80, 10: 80, 11: 85, 12: 55 },
  'oh-press':     { 1: 40, 2: 40, 3: 42, 4: 42, 5: 45, 6: 45, 7: 48, 8: 48, 9: 50, 10: 50, 11: 52, 12: 35 },
  'lat-pulldown': { 1: 80, 2: 80, 3: 85, 4: 85, 5: 90, 6: 90, 7: 95, 8: 95, 9: 100, 10: 100, 11: 105, 12: 70 },
  'cable-row':    { 1: 70, 2: 70, 3: 75, 4: 75, 5: 80, 6: 80, 7: 85, 8: 85, 9: 90, 10: 90, 11: 95, 12: 60 },
  'goblet-squat': { 1: 45, 2: 45, 3: 50, 4: 50, 5: 55, 6: 55, 7: 60, 8: 60, 9: 65, 10: 65, 11: 70, 12: 40 },
  'rdl':          { 1: 80, 2: 80, 3: 85, 4: 85, 5: 90, 6: 95, 7: 100, 8: 105, 9: 110, 10: 115, 11: 120, 12: 75 },
  'deadlift':     { 1: 100, 2: 105, 3: 110, 4: 115, 5: 120, 6: 125, 7: 130, 8: 135, 9: 140, 10: 145, 11: 150, 12: 95 },
}

export function getTargetWeight(exerciseId: string, week: number): number | undefined {
  const clamped = Math.max(1, Math.min(12, week))
  const row = OVERLOAD_TABLE[exerciseId as OverloadKey]
  return row ? row[clamped] : undefined
}

export const OVERLOAD_EXERCISE_NAMES: Record<OverloadKey, string> = {
  'chest-press': 'Chest Press',
  'oh-press': 'OH Press',
  'lat-pulldown': 'Lat Pulldown',
  'cable-row': 'Cable Row',
  'goblet-squat': 'Goblet Squat',
  'rdl': 'RDL',
  'deadlift': 'Deadlift',
}

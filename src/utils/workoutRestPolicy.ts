import type { ExerciseLog } from '../types'

export type RestProfile = 'standard' | 'intense'

const PROFILE = {
  standard: { betweenSets: 90, supersetSwitch: 10, supersetRoundBreak: 30 },
  intense: { betweenSets: 45, supersetSwitch: 10, supersetRoundBreak: 15 },
} as const

/** Rest after logging a completed set — superset rotations use short swaps and a round pause. */
export function computeRestAfterSet(
  exerciseIndex: number,
  setIndex: number,
  exercise: ExerciseLog,
  sessionExercises: ExerciseLog[],
  profile: RestProfile
): { seconds: number; cue?: string } {
  const t = PROFILE[profile]

  if (!exercise.supersetGroupId) {
    return { seconds: t.betweenSets }
  }

  const members = sessionExercises
    .map((ex, idx) => ({ ex, idx }))
    .filter((row) => row.ex.supersetGroupId === exercise.supersetGroupId)
    .sort((a, b) => a.idx - b.idx)

  const pos = members.findIndex((m) => m.idx === exerciseIndex)
  if (pos < 0) return { seconds: t.betweenSets }

  const setNum = exercise.sets[setIndex]?.setNumber ?? setIndex + 1
  const stationCount = members.length
  const isLastStationInRotation = pos === stationCount - 1

  if (!isLastStationInRotation) {
    const partnerName = members[pos + 1].ex.exerciseName
    const label = stationCount >= 3 ? 'Triset' : 'Superset'
    return { seconds: t.supersetSwitch, cue: `${label} — ${partnerName}` }
  }

  const groupIncomplete = members.some(({ ex }) => ex.sets.some((s) => !s.completed))
  if (groupIncomplete) {
    const nextName = members[0].ex.exerciseName
    const label = stationCount >= 3 ? 'Triset' : 'Superset'
    return {
      seconds: t.supersetRoundBreak,
      cue: `${label} pause — round ${setNum} · next ${nextName}`,
    }
  }

  return { seconds: t.betweenSets, cue: 'Block wrap — nice work.' }
}

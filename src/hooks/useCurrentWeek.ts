import { useMemo } from 'react'
import { getPhaseForWeek } from '../data/program'
import type { PhaseConfig } from '../types'

export interface CurrentWeekInfo {
  week: number
  phase: PhaseConfig
  isDeload: boolean
  isProgramComplete: boolean
  daysElapsed: number
}

export function useCurrentWeek(programStartDate: string): CurrentWeekInfo {
  return useMemo(() => {
    const start = new Date(programStartDate + 'T00:00:00')
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
    const rawWeek = Math.floor(daysElapsed / 7) + 1
    const week = Math.min(12, rawWeek)
    const isProgramComplete = rawWeek > 12
    const phase = getPhaseForWeek(week)

    return {
      week,
      phase,
      isDeload: phase.phase === 'deload',
      isProgramComplete,
      daysElapsed,
    }
  }, [programStartDate])
}

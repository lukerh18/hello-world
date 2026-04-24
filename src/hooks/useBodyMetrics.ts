import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { BodyMetrics, WeightEntry, BodyMeasurements } from '../types'
import { DEFAULT_USER_PROFILE } from '../data/userProfile'

const INITIAL_METRICS: BodyMetrics = {
  weightLog: [
    { date: DEFAULT_USER_PROFILE.programStartDate, weight: DEFAULT_USER_PROFILE.startingWeightLbs },
  ],
  measurements: [],
}

export function useBodyMetrics() {
  const [metrics, setMetrics] = useLocalStorage<BodyMetrics>('body_metrics', INITIAL_METRICS)

  const latestWeight: number = metrics.weightLog.length > 0
    ? metrics.weightLog[metrics.weightLog.length - 1].weight
    : DEFAULT_USER_PROFILE.startingWeightLbs

  const addWeightEntry = useCallback(
    (entry: WeightEntry) => {
      setMetrics((prev) => {
        const filtered = prev.weightLog.filter((w) => w.date !== entry.date)
        return {
          ...prev,
          weightLog: [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)),
        }
      })
    },
    [setMetrics]
  )

  const addMeasurements = useCallback(
    (m: BodyMeasurements) => {
      setMetrics((prev) => {
        const filtered = prev.measurements.filter((x) => x.date !== m.date)
        return {
          ...prev,
          measurements: [...filtered, m].sort((a, b) => a.date.localeCompare(b.date)),
        }
      })
    },
    [setMetrics]
  )

  return {
    metrics,
    latestWeight,
    addWeightEntry,
    addMeasurements,
  }
}

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { BodyMetrics, WeightEntry, BodyMeasurements } from '../types'

const LS_WEIGHT = 'weight_log_v1'
const LS_MEAS = 'body_meas_v1'

function lsReadMetrics(): BodyMetrics {
  try {
    const weightLog: WeightEntry[] = JSON.parse(localStorage.getItem(LS_WEIGHT) ?? '[]')
    const measurements: BodyMeasurements[] = JSON.parse(localStorage.getItem(LS_MEAS) ?? '[]')
    return { weightLog, measurements }
  } catch { return { weightLog: [], measurements: [] } }
}

export function useBodyMetrics() {
  const { user, isLocal } = useAuth()
  const [metrics, setMetrics] = useState<BodyMetrics>(isLocal ? lsReadMetrics() : { weightLog: [], measurements: [] })
  const [loading, setLoading] = useState(!isLocal)

  useEffect(() => {
    if (isLocal) return
    if (!user) { setMetrics({ weightLog: [], measurements: [] }); setLoading(false); return }

    Promise.all([
      supabase.from('weight_log').select('*').eq('user_id', user.id).order('date'),
      supabase.from('body_measurements').select('*').eq('user_id', user.id).order('date'),
    ]).then(([weights, meas]) => {
      setMetrics({
        weightLog: (weights.data ?? []).map((r) => ({ date: r.date as string, weight: r.weight as number })),
        measurements: (meas.data ?? []).map((r) => ({
          date: r.date as string,
          chest: r.chest as number | undefined,
          waist: r.waist as number | undefined,
          arms: r.arms as number | undefined,
          thighs: r.thighs as number | undefined,
          bodyFat: r.body_fat as number | undefined,
        })),
      })
      setLoading(false)
    })
  }, [user, isLocal])

  const latestWeight: number = metrics.weightLog.length > 0
    ? metrics.weightLog[metrics.weightLog.length - 1].weight
    : 0

  const addWeightEntry = useCallback((entry: WeightEntry) => {
    setMetrics((prev) => {
      const filtered = prev.weightLog.filter((w) => w.date !== entry.date)
      const next = { ...prev, weightLog: [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)) }
      if (isLocal) localStorage.setItem(LS_WEIGHT, JSON.stringify(next.weightLog))
      return next
    })
    if (!isLocal && user) {
      supabase.from('weight_log').upsert(
        { user_id: user.id, date: entry.date, weight: entry.weight },
        { onConflict: 'user_id,date' }
      )
    }
  }, [user, isLocal])

  const addMeasurements = useCallback((m: BodyMeasurements) => {
    setMetrics((prev) => {
      const filtered = prev.measurements.filter((x) => x.date !== m.date)
      const next = { ...prev, measurements: [...filtered, m].sort((a, b) => a.date.localeCompare(b.date)) }
      if (isLocal) localStorage.setItem(LS_MEAS, JSON.stringify(next.measurements))
      return next
    })
    if (!isLocal && user) {
      supabase.from('body_measurements').upsert({
        user_id: user.id, date: m.date,
        chest: m.chest ?? null, waist: m.waist ?? null,
        arms: m.arms ?? null, thighs: m.thighs ?? null, body_fat: m.bodyFat ?? null,
      }, { onConflict: 'user_id,date' })
    }
  }, [user, isLocal])

  return { metrics, loading, latestWeight, addWeightEntry, addMeasurements }
}

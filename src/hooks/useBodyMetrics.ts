import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { BodyMetrics, WeightEntry, BodyMeasurements } from '../types'

export function useBodyMetrics() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<BodyMetrics>({ weightLog: [], measurements: [] })
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    if (!user) { setMetrics({ weightLog: [], measurements: [] }); setLoading(false); return }
    setLoading(true)

    Promise.all([
      supabase.from('weight_log').select('*').eq('user_id', user.id).order('date'),
      supabase.from('body_measurements').select('*').eq('user_id', user.id).order('date'),
    ])
      .then(([weights, meas]) => {
        if (weights.error || meas.error) {
          console.error('Failed to load body metrics', weights.error ?? meas.error)
          setMetrics({ weightLog: [], measurements: [] })
          return
        }
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
      })
      .catch((error) => {
        console.error('Failed to load body metrics', error)
        setMetrics({ weightLog: [], measurements: [] })
      })
      .finally(() => setLoading(false))
  }, [user, refreshKey])

  const latestWeight: number = metrics.weightLog.length > 0
    ? metrics.weightLog[metrics.weightLog.length - 1].weight
    : 0

  const addWeightEntry = useCallback(async (entry: WeightEntry) => {
    if (!user) return
    const { data, error } = await supabase
      .from('weight_log')
      .upsert({ user_id: user.id, date: entry.date, weight: entry.weight }, { onConflict: 'user_id,date' })
      .select()
      .single()
    if (error) {
      console.error('Failed to save weight entry', error)
      return
    }
    if (data) {
      setMetrics((prev) => {
        const filtered = prev.weightLog.filter((w) => w.date !== entry.date)
        return {
          ...prev,
          weightLog: [...filtered, { date: data.date as string, weight: data.weight as number }]
            .sort((a, b) => a.date.localeCompare(b.date)),
        }
      })
    }
    refresh()
  }, [user, refresh])

  const addMeasurements = useCallback(async (m: BodyMeasurements) => {
    if (!user) return
    const { data, error } = await supabase
      .from('body_measurements')
      .upsert({
        user_id: user.id,
        date: m.date,
        chest: m.chest ?? null,
        waist: m.waist ?? null,
        arms: m.arms ?? null,
        thighs: m.thighs ?? null,
        body_fat: m.bodyFat ?? null,
      }, { onConflict: 'user_id,date' })
      .select()
      .single()
    if (error) {
      console.error('Failed to save body measurements', error)
      return
    }
    if (data) {
      setMetrics((prev) => {
        const filtered = prev.measurements.filter((x) => x.date !== m.date)
        const updated: BodyMeasurements = {
          date: data.date as string,
          chest: data.chest as number | undefined,
          waist: data.waist as number | undefined,
          arms: data.arms as number | undefined,
          thighs: data.thighs as number | undefined,
          bodyFat: data.body_fat as number | undefined,
        }
        return { ...prev, measurements: [...filtered, updated].sort((a, b) => a.date.localeCompare(b.date)) }
      })
    }
    refresh()
  }, [user, refresh])

  return { metrics, loading, refresh, latestWeight, addWeightEntry, addMeasurements }
}

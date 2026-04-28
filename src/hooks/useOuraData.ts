import { useCallback, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface OuraReadiness {
  score: number
  hrv_balance: number
  resting_heart_rate: number
  body_temperature_deviation: number
}

export interface OuraSleep {
  score: number
  total_sleep_duration: number
  deep_sleep_duration: number
  rem_sleep_duration: number
  average_hrv: number
}

export interface OuraActivity {
  score: number
  active_calories: number
  steps: number
}

export interface OuraData {
  date: string
  readiness?: OuraReadiness
  sleep?: OuraSleep
  activity?: OuraActivity
}

interface OuraCache {
  date: string
  data: OuraData
  fetchedAt: number
}

interface RawReadiness {
  score: number
  resting_heart_rate: number
  body_temperature_deviation?: number
  contributors?: { hrv_balance?: number }
}

interface RawSleep {
  score: number
  total_sleep_duration: number
  deep_sleep_duration?: number
  rem_sleep_duration?: number
  average_hrv?: number
}

interface RawActivity {
  score: number
  active_calories: number
  steps: number
}

const CACHE_TTL = 30 * 60 * 1000

export function useOuraData(token: string) {
  const [cache, setCache] = useState<OuraCache | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const isStale = !cache || cache.date !== today || Date.now() - cache.fetchedAt > CACHE_TTL

  const refresh = useCallback(async () => {
    if (!token || !isStale || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.functions.invoke('oura-data', {
        body: { date: today },
      })
      if (error || !data) return

      const r = data.readiness as RawReadiness | null
      const s = data.sleep as RawSleep | null
      const a = data.activity as RawActivity | null

      const ouraData: OuraData = {
        date: today,
        readiness: r
          ? {
              score: r.score,
              hrv_balance: r.contributors?.hrv_balance ?? 0,
              resting_heart_rate: r.resting_heart_rate,
              body_temperature_deviation: r.body_temperature_deviation ?? 0,
            }
          : undefined,
        sleep: s
          ? {
              score: s.score,
              total_sleep_duration: s.total_sleep_duration,
              deep_sleep_duration: s.deep_sleep_duration ?? 0,
              rem_sleep_duration: s.rem_sleep_duration ?? 0,
              average_hrv: s.average_hrv ?? 0,
            }
          : undefined,
        activity: a ? { score: a.score, active_calories: a.active_calories, steps: a.steps } : undefined,
      }
      setCache({ date: today, data: ouraData, fetchedAt: Date.now() })
    } catch {
      // silent — show stale data if available
    }
  }, [token, today, isStale])

  const data: OuraData = cache?.date === today ? cache.data : { date: today }

  return {
    data,
    refresh,
    hasData: Boolean(data.readiness ?? data.sleep ?? data.activity),
    isLoading: isStale && Boolean(token),
  }
}

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

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

const CACHE_TTL = 30 * 60 * 1000

async function fetchEndpoint<T>(endpoint: string, token: string, date: string): Promise<T | undefined> {
  const url = `https://api.ouraring.com/v2/usercollection/${endpoint}?start_date=${date}&end_date=${date}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return undefined
  const json = await res.json()
  return (json.data ?? [])[0] as T | undefined
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

export function useOuraData(token: string) {
  const [cache, setCache] = useLocalStorage<OuraCache | null>('oura_daily_cache', null)

  const today = new Date().toISOString().split('T')[0]
  const isStale = !cache || cache.date !== today || Date.now() - cache.fetchedAt > CACHE_TTL

  const refresh = useCallback(async () => {
    if (!token || !isStale) return
    try {
      const [r, s, a] = await Promise.all([
        fetchEndpoint<RawReadiness>('daily_readiness', token, today),
        fetchEndpoint<RawSleep>('daily_sleep', token, today),
        fetchEndpoint<RawActivity>('daily_activity', token, today),
      ])
      const data: OuraData = {
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
      setCache({ date: today, data, fetchedAt: Date.now() })
    } catch {
      // silent — show stale data if available
    }
  }, [token, today, isStale, setCache])

  const data: OuraData = cache?.date === today ? cache.data : { date: today }

  return {
    data,
    refresh,
    hasData: Boolean(data.readiness ?? data.sleep ?? data.activity),
    isLoading: isStale && Boolean(token),
  }
}

import { useCallback, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

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
const storageKey = (date: string) => `oura_${date}`

function readStorage(date: string): { data: OuraData; fetchedAt: number } | null {
  try {
    const raw = localStorage.getItem(storageKey(date))
    return raw ? (JSON.parse(raw) as { data: OuraData; fetchedAt: number }) : null
  } catch {
    return null
  }
}

function writeStorage(date: string, data: OuraData) {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('oura_') && k !== storageKey(date))
      .forEach((k) => localStorage.removeItem(k))
    localStorage.setItem(storageKey(date), JSON.stringify({ data, fetchedAt: Date.now() }))
  } catch {}
}

export function useOuraData(token: string) {
  const today = new Date().toISOString().split('T')[0]
  const fetchingRef = useRef(false)

  const stored = readStorage(today)
  const hasFreshCache = Boolean(stored && Date.now() - stored.fetchedAt < CACHE_TTL)

  const [data, setData] = useState<OuraData>(() => stored?.data ?? { date: today })
  // Start in loading state if we have a token but no fresh cache
  const [isFetching, setIsFetching] = useState(() => Boolean(token) && !hasFreshCache)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!token || fetchingRef.current) return

    const cached = readStorage(today)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setData(cached.data)
      setIsFetching(false)
      return
    }

    fetchingRef.current = true
    setIsFetching(true)
    setError(null)

    try {
      const { data: resp, error: fnError } = await supabase.functions.invoke('oura-data', {
        body: { date: today },
      })
      if (fnError || !resp) {
        setError('Failed to load Oura data')
        return
      }

      const r = resp.readiness as RawReadiness | null
      const s = resp.sleep as RawSleep | null
      const a = resp.activity as RawActivity | null

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
        activity: a
          ? { score: a.score, active_calories: a.active_calories, steps: a.steps }
          : undefined,
      }

      setData(ouraData)
      writeStorage(today, ouraData)
    } catch {
      setError('Network error — check your connection')
    } finally {
      fetchingRef.current = false
      setIsFetching(false)
    }
  }, [token, today])

  const hasData = Boolean(data.readiness ?? data.sleep ?? data.activity)

  return { data, refresh, hasData, isLoading: isFetching, error }
}

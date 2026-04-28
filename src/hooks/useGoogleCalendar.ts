import { useState, useCallback, useEffect } from 'react'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

export interface CalendarEvent {
  id: string
  summary: string
  start: string
  end: string
  allDay: boolean
  calendarName: string
  calendarColor: string
}

interface TokenCache {
  token: string
  expiresAt: number
}

const TOKEN_KEY = 'gcal_token_v1'

function readCachedToken(): TokenCache | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TokenCache
    return parsed.expiresAt > Date.now() ? parsed : null
  } catch { return null }
}

export interface FreeSlot {
  start: Date
  end: Date
  label: string
}

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'

export type EventCategory = 'physical' | 'family' | 'work' | 'other'

export function categorizeEvent(summary: string): EventCategory {
  const s = summary.toLowerCase()
  if (/soccer|game|match|baseball|basketball|football|hockey|tennis|lacrosse|practice|sport|gym|crossfit/.test(s)) return 'physical'
  if (/kids?|child|daughter|son|school|pickup|drop.?off|birthday|recital|play date|playdate|party|family|daycare/.test(s)) return 'family'
  if (/meeting|standup|stand.up|call|review|sync|interview|1:1|one.on.one|presentation|demo|workshop/.test(s)) return 'work'
  return 'other'
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-gis')) { resolve(); return }
    const script = document.createElement('script')
    script.id = 'google-gis'
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

export function useGoogleCalendar(clientId: string) {
  const [tokenCache, setTokenCache] = useState<TokenCache | null>(readCachedToken)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accessToken = tokenCache?.token ?? null
  const isConnected = Boolean(accessToken)

  const connect = useCallback(async () => {
    if (!clientId) { setError('No Google Client ID configured in Settings'); return }
    setError(null)
    try {
      await loadGisScript()
      await new Promise<void>((resolve) => setTimeout(resolve, 200))

      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: CALENDAR_SCOPE,
        callback: (response) => {
          if (response.error) {
            setError(`Google auth failed: ${response.error}`)
          } else if (response.access_token) {
            const cache: TokenCache = {
              token: response.access_token,
              expiresAt: Date.now() + (3600 - 60) * 1000,
            }
            localStorage.setItem(TOKEN_KEY, JSON.stringify(cache))
            setTokenCache(cache)
          }
        },
      })
      tokenClient.requestAccessToken()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed')
    }
  }, [clientId])

  const fetchTodayEvents = useCallback(async (token: string) => {
    setLoading(true)
    try {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const headers = { Authorization: `Bearer ${token}` }

      // Fetch all calendars
      const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', { headers })
      if (listRes.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        setTokenCache(null)
        setError('Session expired — reconnect calendar')
        return
      }
      if (!listRes.ok) throw new Error('Failed to fetch calendars')
      const listData = await listRes.json()
      const calendars: Array<{ id: string; summary: string; backgroundColor?: string }> = listData.items ?? []

      const allEvents: CalendarEvent[] = []
      await Promise.all(
        calendars.map(async (cal) => {
          try {
            const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events`)
            url.searchParams.set('timeMin', startOfDay.toISOString())
            url.searchParams.set('timeMax', endOfDay.toISOString())
            url.searchParams.set('singleEvents', 'true')
            url.searchParams.set('orderBy', 'startTime')
            url.searchParams.set('maxResults', '25')
            const res = await fetch(url.toString(), { headers })
            if (!res.ok) return
            const data = await res.json()
            for (const e of data.items ?? []) {
              allEvents.push({
                id: e.id as string,
                summary: (e.summary as string) ?? 'Busy',
                start: (e.start?.dateTime || e.start?.date) as string,
                end:   (e.end?.dateTime   || e.end?.date)   as string,
                allDay: !e.start?.dateTime,
                calendarName: cal.summary,
                calendarColor: cal.backgroundColor ?? '#4285F4',
              })
            }
          } catch { /* skip this calendar */ }
        })
      )
      allEvents.sort((a, b) => a.start.localeCompare(b.start))
      setEvents(allEvents)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch on mount from persisted token
  useEffect(() => {
    const cached = readCachedToken()
    if (cached) fetchTodayEvents(cached.token)
  }, [fetchTodayEvents])

  useEffect(() => {
    if (accessToken) fetchTodayEvents(accessToken)
  }, [accessToken, fetchTodayEvents])

  const disconnect = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setTokenCache(null)
    setEvents([])
  }, [])

  const getFreeSlots = useCallback((): FreeSlot[] => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    // Primary workout window: 5–7 AM
    const windowStart = new Date(today); windowStart.setHours(5, 0, 0, 0)
    const windowEnd = new Date(today); windowEnd.setHours(7, 0, 0, 0)
    const workoutDuration = 55 * 60 * 1000

    const busyTimes = events
      .filter((e) => e.start && e.end)
      .map((e) => ({ start: new Date(e.start), end: new Date(e.end) }))
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    const slots: FreeSlot[] = []
    let cursor = windowStart

    for (const busy of busyTimes) {
      if (cursor.getTime() + workoutDuration <= busy.start.getTime()) {
        const slotEnd = new Date(cursor.getTime() + workoutDuration)
        slots.push({ start: new Date(cursor), end: slotEnd, label: formatSlot(cursor, slotEnd) })
      }
      if (busy.end > cursor) cursor = new Date(busy.end)
    }

    if (cursor.getTime() + workoutDuration <= windowEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + workoutDuration)
      slots.push({ start: new Date(cursor), end: slotEnd, label: formatSlot(cursor, slotEnd) })
    }

    return slots
  }, [events])

  // Evening 30-min free blocks (6–9 PM) for family activity suggestions
  const getEveningSlots = useCallback((): FreeSlot[] => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const windowStart = new Date(today); windowStart.setHours(18, 0, 0, 0)
    const windowEnd = new Date(today); windowEnd.setHours(21, 0, 0, 0)
    const blockDuration = 30 * 60 * 1000

    const busyTimes = events
      .filter((e) => e.start && e.end)
      .map((e) => ({ start: new Date(e.start), end: new Date(e.end) }))
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    const slots: FreeSlot[] = []
    let cursor = windowStart

    for (const busy of busyTimes) {
      if (cursor.getTime() + blockDuration <= busy.start.getTime()) {
        const slotEnd = new Date(cursor.getTime() + blockDuration)
        slots.push({ start: new Date(cursor), end: slotEnd, label: formatSlot(cursor, slotEnd) })
        break
      }
      if (busy.end > cursor) cursor = new Date(busy.end)
    }

    if (slots.length === 0 && cursor.getTime() + blockDuration <= windowEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + blockDuration)
      slots.push({ start: new Date(cursor), end: slotEnd, label: formatSlot(cursor, slotEnd) })
    }

    return slots
  }, [events])

  const addWorkoutEvent = useCallback(
    async (workoutName: string, description: string, slot: FreeSlot) => {
      if (!accessToken) return false
      try {
        const res = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: `🏋️ ${workoutName}`,
              description,
              start: { dateTime: slot.start.toISOString() },
              end: { dateTime: slot.end.toISOString() },
              reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
            }),
          }
        )
        return res.ok
      } catch {
        return false
      }
    },
    [accessToken]
  )

  const refresh = useCallback(() => {
    if (accessToken) fetchTodayEvents(accessToken)
  }, [accessToken, fetchTodayEvents])

  return { isConnected, connect, disconnect, refresh, events, getFreeSlots, getEveningSlots, addWorkoutEvent, loading, error }
}

function formatSlot(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${fmt(start)} – ${fmt(end)}`
}

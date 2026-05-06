import { useCallback, useEffect, useState } from 'react'
import type { CalendarEvent } from './useGoogleCalendar'

interface TokenCache {
  token: string
  expiresAt: number
}

const TOKEN_KEY = 'mscal_token_v1'
const GRAPH_SCOPE = 'openid profile User.Read Calendars.Read'
const MICROSOFT_TENANT_ID = import.meta.env.VITE_MICROSOFT_TENANT_ID?.trim() || 'common'

function readCachedToken(): TokenCache | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TokenCache
    return parsed.expiresAt > Date.now() ? parsed : null
  } catch {
    return null
  }
}

function decodeJwtExp(token: string): number {
  try {
    const payload = token.split('.')[1]
    if (!payload) return Date.now() + 45 * 60 * 1000
    const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return data.exp ? data.exp * 1000 : Date.now() + 45 * 60 * 1000
  } catch {
    return Date.now() + 45 * 60 * 1000
  }
}

async function requestAccessToken(clientId: string): Promise<string> {
  const redirectUri = `${window.location.origin}${window.location.pathname}`
  const authUrl = new URL(`https://login.microsoftonline.com/${encodeURIComponent(MICROSOFT_TENANT_ID)}/oauth2/v2.0/authorize`)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'token')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_mode', 'fragment')
  authUrl.searchParams.set('scope', GRAPH_SCOPE)
  authUrl.searchParams.set('prompt', 'select_account')

  const popup = window.open(authUrl.toString(), 'ms-calendar-auth', 'width=560,height=700')
  if (!popup) throw new Error('Popup blocked. Enable popups and try again.')

  return new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Microsoft sign-in timed out'))
    }, 90000)

    const cleanup = () => {
      window.clearTimeout(timeout)
      window.clearInterval(poll)
      try { popup.close() } catch { /* noop */ }
    }

    const poll = window.setInterval(() => {
      try {
        if (popup.closed) {
          cleanup()
          reject(new Error('Sign-in cancelled'))
          return
        }
        const href = popup.location.href
        if (!href.startsWith(redirectUri)) return

        const hash = popup.location.hash.startsWith('#') ? popup.location.hash.slice(1) : popup.location.hash
        const params = new URLSearchParams(hash)
        const token = params.get('access_token')
        const err = params.get('error_description') ?? params.get('error')

        cleanup()
        if (token) resolve(token)
        else reject(new Error(err || 'Microsoft auth failed'))
      } catch {
        // Ignore cross-origin until popup returns to redirect URI
      }
    }, 400)
  })
}

export function useMicrosoftCalendar(clientId: string) {
  const [tokenCache, setTokenCache] = useState<TokenCache | null>(readCachedToken)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accessToken = tokenCache?.token ?? null
  const isConnected = Boolean(accessToken)

  const connect = useCallback(async () => {
    if (!clientId) {
      setError('No Microsoft Client ID configured in Settings')
      return
    }
    setError(null)
    try {
      const token = await requestAccessToken(clientId)
      const cache: TokenCache = {
        token,
        expiresAt: decodeJwtExp(token),
      }
      localStorage.setItem(TOKEN_KEY, JSON.stringify(cache))
      setTokenCache(cache)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Microsoft sign-in failed')
    }
  }, [clientId])

  const fetchTodayEvents = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

      const url = new URL('https://graph.microsoft.com/v1.0/me/calendar/calendarView')
      url.searchParams.set('startDateTime', startOfDay.toISOString())
      url.searchParams.set('endDateTime', endOfDay.toISOString())
      url.searchParams.set('$top', '50')
      url.searchParams.set('$orderby', 'start/dateTime')

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          Prefer: 'outlook.timezone="America/Los_Angeles"',
        },
      })

      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        setTokenCache(null)
        setError('Microsoft session expired — reconnect')
        return
      }
      if (res.status === 403) {
        throw new Error('Calendar access blocked by your organization policy')
      }
      if (!res.ok) throw new Error('Failed to load Microsoft calendar')

      const data = await res.json() as {
        value?: Array<{
          id: string
          subject?: string
          start?: { dateTime?: string; timeZone?: string }
          end?: { dateTime?: string; timeZone?: string }
          isAllDay?: boolean
        }>
      }

      const mapped: CalendarEvent[] = (data.value ?? [])
        .filter((e) => e.start?.dateTime && e.end?.dateTime)
        .map((e) => ({
          id: `ms_${e.id}`,
          summary: e.subject || 'Busy',
          start: new Date(e.start!.dateTime!).toISOString(),
          end: new Date(e.end!.dateTime!).toISOString(),
          allDay: Boolean(e.isAllDay),
          calendarName: 'Office 365',
          calendarColor: '#2563EB',
        }))
        .sort((a, b) => a.start.localeCompare(b.start))

      setEvents(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Microsoft calendar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = readCachedToken()
    if (cached) fetchTodayEvents(cached.token)
  }, [fetchTodayEvents])

  useEffect(() => {
    if (accessToken) fetchTodayEvents(accessToken)
  }, [accessToken, fetchTodayEvents])

  const refresh = useCallback(() => {
    if (accessToken) fetchTodayEvents(accessToken)
  }, [accessToken, fetchTodayEvents])

  const disconnect = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setTokenCache(null)
    setEvents([])
  }, [])

  return { isConnected, connect, disconnect, refresh, events, loading, error }
}

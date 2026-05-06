import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export interface MealReminder {
  mealId: string
  label: string
  time: string // "HH:MM" 24h
  enabled: boolean
}

// Stable notification IDs per meal
const NOTIFICATION_IDS: Record<string, number> = {
  breakfast: 1001,
  lunch: 1002,
  dinner: 1003,
  snacks: 1004,
}

const STORAGE_KEY = 'meal_reminders_v1'

const DEFAULTS: MealReminder[] = [
  { mealId: 'breakfast', label: 'Breakfast', time: '08:00', enabled: true },
  { mealId: 'lunch',     label: 'Lunch',     time: '12:30', enabled: true },
  { mealId: 'dinner',    label: 'Dinner',    time: '18:30', enabled: true },
  { mealId: 'snacks',    label: 'Snack',     time: '15:00', enabled: false },
]

function load(): MealReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MealReminder[]) : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export const isNativePlatform = Capacitor.isNativePlatform()

async function scheduleNative(reminders: MealReminder[]) {
  const toCancel = Object.values(NOTIFICATION_IDS).map((id) => ({ id }))
  await LocalNotifications.cancel({ notifications: toCancel }).catch(() => {})

  const enabled = reminders.filter((r) => r.enabled)
  if (enabled.length === 0) return

  await LocalNotifications.schedule({
    notifications: enabled.map((r) => {
      const [hour, minute] = r.time.split(':').map(Number)
      return {
        id: NOTIFICATION_IDS[r.mealId] ?? Math.floor(Math.random() * 10000),
        title: `${r.label} reminder`,
        body: `Time to log your ${r.label.toLowerCase()}!`,
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
      }
    }),
  })
}

export function useMealReminders() {
  const [reminders, setReminders] = useState<MealReminder[]>(load)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt')

  // Resolve permission state on mount
  useEffect(() => {
    if (isNativePlatform) {
      LocalNotifications.checkPermissions().then(({ display }) => {
        setPermission(display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt')
      })
    } else if (!('Notification' in window)) {
      setPermission('unsupported')
    } else {
      const p = Notification.permission
      setPermission(p === 'granted' ? 'granted' : p === 'denied' ? 'denied' : 'prompt')
    }
  }, [])

  // Reschedule once we know permission is granted
  useEffect(() => {
    if (isNativePlatform && permission === 'granted') {
      scheduleNative(reminders)
    }
    // intentionally only on permission change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission])

  const persistAndSchedule = useCallback((updated: MealReminder[], currentPermission: typeof permission) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    if (isNativePlatform && currentPermission === 'granted') scheduleNative(updated)
  }, [])

  const toggle = useCallback((mealId: string) => {
    setReminders((prev) => {
      const next = prev.map((r) => r.mealId === mealId ? { ...r, enabled: !r.enabled } : r)
      persistAndSchedule(next, permission)
      return next
    })
  }, [permission, persistAndSchedule])

  const setTime = useCallback((mealId: string, time: string) => {
    setReminders((prev) => {
      const next = prev.map((r) => r.mealId === mealId ? { ...r, time } : r)
      persistAndSchedule(next, permission)
      return next
    })
  }, [permission, persistAndSchedule])

  const requestPermission = useCallback(async (): Promise<typeof permission> => {
    if (isNativePlatform) {
      const { display } = await LocalNotifications.requestPermissions()
      const p: typeof permission = display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt'
      setPermission(p)
      if (p === 'granted') await scheduleNative(reminders)
      return p
    }
    if (!('Notification' in window)) { setPermission('unsupported'); return 'unsupported' }
    const result = await Notification.requestPermission()
    const p: typeof permission = result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'prompt'
    setPermission(p)
    return p
  }, [reminders])

  // Web fallback: check if a reminder is due and unfired
  const getDueReminders = useCallback((loggedMealIds: Set<string>): MealReminder[] => {
    const d = new Date()
    const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return reminders.filter((r) => r.enabled && r.time <= hhmm && !loggedMealIds.has(r.mealId))
  }, [reminders])

  return { reminders, permission, toggle, setTime, requestPermission, getDueReminders, isNative: isNativePlatform }
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useLocalStorage } from './useLocalStorage'
import type { MovementDayMode, MovementDayPlan, MovementType } from '../types'

export interface MovementReminder {
  id: string
  label: string
  body: string
  time: string
  enabled: boolean
  suggestedType: MovementType
}

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'
type ReminderSettings = Record<string, Pick<MovementReminder, 'time' | 'enabled'>>

const STORAGE_KEY = 'movement_reminders_v1'
const SKIPPED_KEY = 'movement_reminder_skips_v1'
const NOTIFICATION_IDS: Record<string, number> = {
  morning_walk: 2101,
  midday_reset: 2102,
  afternoon_mobility: 2103,
}

export const isMovementNativePlatform = Capacitor.isNativePlatform()

function readSkipped(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(SKIPPED_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
  } catch {
    return {}
  }
}

function writeSkipped(next: Record<string, string[]>) {
  localStorage.setItem(SKIPPED_KEY, JSON.stringify(next))
}

function getDefaults(mode: MovementDayMode): MovementReminder[] {
  if (mode === 'heavy_workout') {
    return [
      {
        id: 'morning_walk',
        label: 'Call walk',
        body: 'If a call fits, take it on your feet. Keep the main workout primary.',
        time: '10:30',
        enabled: true,
        suggestedType: 'call_walk',
      },
      {
        id: 'midday_reset',
        label: '2-minute stretch',
        body: 'Small reset: loosen hips, shoulders, and back.',
        time: '14:00',
        enabled: true,
        suggestedType: 'stretch',
      },
      {
        id: 'afternoon_mobility',
        label: '10 easy squats',
        body: 'A low-friction movement snack is enough.',
        time: '16:30',
        enabled: false,
        suggestedType: 'squats',
      },
    ]
  }

  return [
    {
      id: 'morning_walk',
      label: 'Morning walk',
      body: 'Light movement day: get outside if you can.',
      time: '08:30',
      enabled: true,
      suggestedType: 'walk',
    },
    {
      id: 'midday_reset',
      label: 'Midday reset',
      body: 'Take a longer walk or mobility reset.',
      time: '12:30',
      enabled: true,
      suggestedType: 'walk',
    },
    {
      id: 'afternoon_mobility',
      label: 'Afternoon mobility',
      body: 'Recovery work counts. Stretch, walk, or move gently.',
      time: '16:30',
      enabled: true,
      suggestedType: 'mobility',
    },
  ]
}

async function scheduleNative(reminders: MovementReminder[], plan: MovementDayPlan) {
  const toCancel = Object.values(NOTIFICATION_IDS).map((id) => ({ id }))
  await LocalNotifications.cancel({ notifications: toCancel }).catch(() => {})

  const enabled = reminders.filter((reminder) => reminder.enabled)
  if (enabled.length === 0) return

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const quietActive = plan.date === today && Boolean(plan.quietUntil && plan.quietUntil > now.toTimeString().slice(0, 5))
  const notifications = enabled
    .filter((reminder) => !quietActive || !plan.quietUntil || reminder.time > plan.quietUntil)
    .map((reminder) => {
      const [hour, minute] = reminder.time.split(':').map(Number)
      return {
        id: NOTIFICATION_IDS[reminder.id],
        title: reminder.label,
        body: reminder.body,
        schedule: { on: { hour, minute }, repeats: !quietActive, allowWhileIdle: true },
        extra: {
          route: '/workout?tab=move',
          movementType: reminder.suggestedType,
        },
      }
    })

  if (notifications.length === 0) return
  await LocalNotifications.schedule({ notifications })
}

export function useMovementReminders(plan: MovementDayPlan) {
  const [settings, setSettings] = useLocalStorage<ReminderSettings>(STORAGE_KEY, {})
  const [permission, setPermission] = useState<PermissionState>(isMovementNativePlatform ? 'prompt' : 'unsupported')
  const [skipped, setSkipped] = useState<Record<string, string[]>>(readSkipped)

  const reminders = useMemo(
    () =>
      getDefaults(plan.mode).map((reminder) => ({
        ...reminder,
        ...(settings[reminder.id] ?? {}),
      })),
    [plan.mode, settings]
  )

  useEffect(() => {
    if (!isMovementNativePlatform) {
      setPermission('unsupported')
      return
    }

    LocalNotifications.checkPermissions().then(({ display }) => {
      setPermission(display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt')
    })
  }, [])

  useEffect(() => {
    if (isMovementNativePlatform && permission === 'granted') {
      scheduleNative(reminders, plan)
    }
  }, [permission, reminders, plan])

  const persistAndSchedule = useCallback(
    (updated: MovementReminder[]) => {
      setSettings(
        updated.reduce<ReminderSettings>((next, reminder) => {
          next[reminder.id] = { time: reminder.time, enabled: reminder.enabled }
          return next
        }, {})
      )
      if (isMovementNativePlatform && permission === 'granted') scheduleNative(updated, plan)
    },
    [permission, plan, setSettings]
  )

  const toggle = useCallback(
    (id: string) => {
      const updated = reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
      )
      persistAndSchedule(updated)
    },
    [persistAndSchedule, reminders]
  )

  const setTime = useCallback(
    (id: string, time: string) => {
      const updated = reminders.map((reminder) => (reminder.id === id ? { ...reminder, time } : reminder))
      persistAndSchedule(updated)
    },
    [persistAndSchedule, reminders]
  )

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    if (!isMovementNativePlatform) {
      setPermission('unsupported')
      return 'unsupported'
    }

    const { display } = await LocalNotifications.requestPermissions()
    const next = display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt'
    setPermission(next)
    if (next === 'granted') await scheduleNative(reminders, plan)
    return next
  }, [plan, reminders])

  const skipReminder = useCallback(
    (id: string) => {
      setSkipped((prev) => {
        const skippedToday = new Set(prev[plan.date] ?? [])
        skippedToday.add(id)
        const next = { ...prev, [plan.date]: Array.from(skippedToday) }
        writeSkipped(next)
        return next
      })
    },
    [plan.date]
  )

  const getDueReminders = useCallback(
    (completedBreaks: number): MovementReminder[] => {
      if (plan.quietUntil && plan.quietUntil > new Date().toTimeString().slice(0, 5)) return []
      const hhmm = new Date().toTimeString().slice(0, 5)
      const skippedToday = new Set(skipped[plan.date] ?? [])
      return reminders.filter(
        (reminder) =>
          reminder.enabled &&
          reminder.time <= hhmm &&
          completedBreaks < plan.targetBreaks &&
          !skippedToday.has(reminder.id)
      )
    },
    [plan.date, plan.quietUntil, plan.targetBreaks, reminders, skipped]
  )

  return {
    reminders,
    permission,
    toggle,
    setTime,
    requestPermission,
    skipReminder,
    getDueReminders,
    isNative: isMovementNativePlatform,
  }
}

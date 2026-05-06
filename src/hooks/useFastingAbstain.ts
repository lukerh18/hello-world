import { useCallback, useEffect, useState } from 'react'

export type AbstainRuleId = 'alcohol' | 'late_snack' | 'sweets'

export interface AbstainRule {
  id: AbstainRuleId
  label: string
}

export interface FastingAbstainDay {
  date: string
  firstMealTime: string
  lastMealTime: string
  kitchenClosed: boolean
  abstain: Record<AbstainRuleId, boolean>
}

const STORAGE_KEY = 'body_composition_fasting_v1'
export const FASTING_ABSTAIN_UPDATED_EVENT = 'fasting-abstain-updated'

export const DEFAULT_FIRST_MEAL_TIME = '10:00'
export const DEFAULT_LAST_MEAL_TIME = '18:00'

export const ABSTAIN_RULES: AbstainRule[] = [
  { id: 'alcohol', label: 'No alcohol' },
  { id: 'late_snack', label: 'No late snacks' },
  { id: 'sweets', label: 'No sweets, sugary drinks, or junk' },
]

const DEFAULT_ABSTAIN: Record<AbstainRuleId, boolean> = {
  alcohol: false,
  late_snack: false,
  sweets: false,
}

function readStore(): Record<string, FastingAbstainDay> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, FastingAbstainDay>) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, FastingAbstainDay>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new Event(FASTING_ABSTAIN_UPDATED_EVENT))
}

export function createFastingAbstainDay(date: string): FastingAbstainDay {
  return {
    date,
    firstMealTime: DEFAULT_FIRST_MEAL_TIME,
    lastMealTime: DEFAULT_LAST_MEAL_TIME,
    kitchenClosed: false,
    abstain: { ...DEFAULT_ABSTAIN },
  }
}

export function getFastingAbstainDay(date: string): FastingAbstainDay {
  return readStore()[date] ?? createFastingAbstainDay(date)
}

export function isFastingAbstainComplete(day: FastingAbstainDay): boolean {
  return day.kitchenClosed && ABSTAIN_RULES.every((rule) => day.abstain[rule.id])
}

export function getFastingAbstainScore(day: FastingAbstainDay): number {
  const eveningCutoffPoints = day.kitchenClosed ? 15 : 0
  const pointsPerRule = 10 / ABSTAIN_RULES.length
  const abstainPoints = ABSTAIN_RULES.reduce(
    (sum, rule) => sum + (day.abstain[rule.id] ? pointsPerRule : 0),
    0
  )
  return Math.round(eveningCutoffPoints + abstainPoints)
}

export function useFastingAbstain(date: string) {
  const [day, setDay] = useState<FastingAbstainDay>(() => getFastingAbstainDay(date))

  useEffect(() => {
    const refresh = () => setDay(getFastingAbstainDay(date))
    refresh()
    window.addEventListener(FASTING_ABSTAIN_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(FASTING_ABSTAIN_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [date])

  const updateDay = useCallback(
    (updater: (current: FastingAbstainDay) => FastingAbstainDay) => {
      const store = readStore()
      const next = updater(store[date] ?? createFastingAbstainDay(date))
      store[date] = next
      writeStore(store)
      setDay(next)
    },
    [date]
  )

  const setKitchenClosed = useCallback(
    (kitchenClosed: boolean) => updateDay((current) => ({ ...current, kitchenClosed })),
    [updateDay]
  )

  const toggleRule = useCallback(
    (ruleId: AbstainRuleId) =>
      updateDay((current) => ({
        ...current,
        abstain: {
          ...current.abstain,
          [ruleId]: !current.abstain[ruleId],
        },
      })),
    [updateDay]
  )

  const updateWindow = useCallback(
    (firstMealTime: string, lastMealTime: string) =>
      updateDay((current) => ({ ...current, firstMealTime, lastMealTime })),
    [updateDay]
  )

  return {
    day,
    score: getFastingAbstainScore(day),
    complete: isFastingAbstainComplete(day),
    setKitchenClosed,
    toggleRule,
    updateWindow,
  }
}

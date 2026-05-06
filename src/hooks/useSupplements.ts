import { useCallback, useEffect, useState } from 'react'
import { type SupplementTimeBlock, SUPPLEMENT_WINDOWS, getCurrentWindowId } from '../data/supplements'

interface SupplementState {
  completed: SupplementTimeBlock[]
}

const STORAGE_KEY = 'supplement_completion_v2'
export const SUPPLEMENT_COMPLETION_UPDATED_EVENT = 'supplement-completion-updated'

function readStore(): Record<string, SupplementState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, SupplementState>
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, SupplementState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new Event(SUPPLEMENT_COMPLETION_UPDATED_EVENT))
}

export function getSupplementCompletionForDate(date: string): SupplementState {
  const store = readStore()
  return store[date] ?? { completed: [] }
}

export function isSupplementDayComplete(date: string): boolean {
  return getSupplementCompletionForDate(date).completed.length >= SUPPLEMENT_WINDOWS.length
}

export function useSupplements(date: string) {
  const [state, setState] = useState<SupplementState>(() => {
    return getSupplementCompletionForDate(date)
  })

  useEffect(() => {
    const refresh = () => setState(getSupplementCompletionForDate(date))
    refresh()
    window.addEventListener(SUPPLEMENT_COMPLETION_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(SUPPLEMENT_COMPLETION_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [date])

  const isComplete = useCallback(
    (block: SupplementTimeBlock) => state.completed.includes(block),
    [state.completed]
  )

  const toggleWindow = useCallback((block: SupplementTimeBlock) => {
    const store = readStore()
    const current = store[date] ?? { completed: [] }
    const next = current.completed.includes(block)
      ? current.completed.filter((b) => b !== block)
      : [...current.completed, block]
    store[date] = { completed: next }
    writeStore(store)
    setState({ completed: next })
  }, [date])

  const nextDueWindow = (() => {
    const currentId = getCurrentWindowId()
    // if current window isn't done, it's next
    if (currentId && !state.completed.includes(currentId)) return currentId
    // otherwise find the earliest upcoming uncompleted window
    const h = new Date().getHours()
    for (const w of SUPPLEMENT_WINDOWS) {
      if (w.startHour > h && !state.completed.includes(w.id)) return w.id
    }
    return null
  })()

  const completionRatio = state.completed.length / SUPPLEMENT_WINDOWS.length

  return {
    completedWindows: state.completed,
    completionRatio,
    isComplete,
    toggleWindow,
    nextDueWindow,
  }
}

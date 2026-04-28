import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface SummaryContext {
  dayName: string
  workoutLabel: string
  week: number
  phase: string
  weightLbs: number
  daysToGoal: number
}

export function useDailySummary(context: SummaryContext) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    supabase.functions
      .invoke('daily-summary', { body: context })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data?.summary) setSummary(data.summary)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  // Re-run only when today changes (context values change at midnight)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.dayName, context.week])

  return { summary, loading }
}

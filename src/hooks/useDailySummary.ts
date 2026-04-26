import { useState, useEffect } from 'react'

interface SummaryContext {
  dayName: string
  workoutLabel: string
  week: number
  phase: string
  weightLbs: number
  daysToGoal: number
}

interface CachedSummary {
  date: string
  text: string
}

const CACHE_KEY = 'daily_summary_cache'

export function useDailySummary(apiKey: string, context: SummaryContext) {
  const today = new Date().toISOString().split('T')[0]
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!apiKey) return

    // Return cached summary if already generated today
    try {
      const cached: CachedSummary = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
      if (cached?.date === today) {
        setSummary(cached.text)
        return
      }
    } catch {
      // ignore
    }

    const { dayName, workoutLabel, week, phase, weightLbs, daysToGoal } = context
    const lbsToGoal = Math.max(0, weightLbs - 185)

    setLoading(true)
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [
          {
            role: 'user',
            content: `Write a 1-2 sentence personal morning briefing for Luke's fitness day. Be direct, specific, and motivating. No greeting, no emojis, no prefix labels.

Context: ${dayName} · ${workoutLabel} · Week ${week} ${phase} phase · ${weightLbs} lbs (${lbsToGoal > 0 ? `${lbsToGoal} lbs from goal` : 'goal reached'}) · ${daysToGoal} days to July 2026.`,
          },
        ],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const text: string = data.content?.[0]?.text ?? ''
        if (text) {
          setSummary(text)
          localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, text }))
        }
      })
      .catch(() => {
        // silently fail — static fallback shown instead
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, today])

  return { summary, loading }
}

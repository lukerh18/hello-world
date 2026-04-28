import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export type GoalCategory = 'spirit' | 'soul' | 'body'

export interface GoalEntry {
  id: string
  category: GoalCategory
  text: string
  createdAt: string
}

type CurrentGoals = Record<GoalCategory, string>
type GoalHistory = Record<GoalCategory, GoalEntry[]>

const CATEGORIES: GoalCategory[] = ['spirit', 'soul', 'body']
const LS_KEY = 'goals_v1'

const EMPTY: GoalHistory = { spirit: [], soul: [], body: [] }

function lsRead(): GoalHistory {
  try { return { ...EMPTY, ...(JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as GoalHistory) } }
  catch { return EMPTY }
}

export function useGoals() {
  const { user, isLocal } = useAuth()
  const [history, setHistory] = useState<GoalHistory>(isLocal ? lsRead() : EMPTY)

  const current: CurrentGoals = {
    spirit: history.spirit[0]?.text ?? '',
    soul:   history.soul[0]?.text ?? '',
    body:   history.body[0]?.text ?? '',
  }

  useEffect(() => {
    if (isLocal || !user) return
    supabase
      .from('goals')
      .select('id, category, text, created_at')
      .eq('user_id', user.id)
      .in('category', CATEGORIES)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        const byCategory: GoalHistory = { spirit: [], soul: [], body: [] }
        for (const row of data) {
          const cat = row.category as GoalCategory
          if (byCategory[cat]) {
            byCategory[cat].push({ id: row.id as string, category: cat, text: row.text as string, createdAt: row.created_at as string })
          }
        }
        setHistory(byCategory)
      })
  }, [user, isLocal])

  const updateGoal = useCallback((category: GoalCategory, text: string) => {
    if (!text.trim()) return
    const entry: GoalEntry = { id: crypto.randomUUID(), category, text: text.trim(), createdAt: new Date().toISOString() }
    const next = { ...history, [category]: [entry, ...history[category]] }
    setHistory(next)
    if (isLocal) {
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return
    }
    if (!user) return
    supabase.from('goals').insert({ user_id: user.id, category, text: text.trim() })
  }, [user, isLocal, history])

  return { current, history, updateGoal }
}

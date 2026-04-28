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

export function useGoals() {
  const { user } = useAuth()
  const [current, setCurrent] = useState<CurrentGoals>({ spirit: '', soul: '', body: '' })
  const [history, setHistory] = useState<GoalHistory>({ spirit: [], soul: [], body: [] })

  useEffect(() => {
    if (!user) return
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
        setCurrent({
          spirit: byCategory.spirit[0]?.text ?? '',
          soul:   byCategory.soul[0]?.text ?? '',
          body:   byCategory.body[0]?.text ?? '',
        })
      })
  }, [user])

  const updateGoal = useCallback(async (category: GoalCategory, text: string) => {
    if (!user || !text.trim()) return
    const { data, error } = await supabase
      .from('goals')
      .insert({ user_id: user.id, category, text: text.trim() })
      .select()
      .single()
    if (error || !data) return
    const entry: GoalEntry = { id: data.id as string, category, text: text.trim(), createdAt: data.created_at as string }
    setCurrent((prev) => ({ ...prev, [category]: text.trim() }))
    setHistory((prev) => ({ ...prev, [category]: [entry, ...prev[category]] }))
  }, [user])

  return { current, history, updateGoal }
}

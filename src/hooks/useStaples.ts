import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface Staple {
  id: string
  name: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

const LS_KEY = 'staples_v1'

function lsRead(): Staple[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as Staple[] }
  catch { return [] }
}

function toStaple(row: Record<string, unknown>): Staple {
  return {
    id: row.id as string,
    name: row.name as string,
    servingSize: (row.serving_size as string) ?? '',
    calories: (row.calories as number) ?? 0,
    protein: (row.protein as number) ?? 0,
    carbs: (row.carbs as number) ?? 0,
    fat: (row.fat as number) ?? 0,
  }
}

export function useStaples() {
  const [staples, setStaples] = useState<Staple[]>(isSupabaseConfigured ? [] : lsRead())

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('staples')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setStaples(data.map(toStaple))
      })
  }, [])

  const addStaple = useCallback(async (s: Omit<Staple, 'id'>) => {
    const newStaple: Staple = { ...s, id: crypto.randomUUID() }
    setStaples((prev) => {
      const next = [...prev, newStaple]
      if (!isSupabaseConfigured) localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
    if (!isSupabaseConfigured) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    supabase.from('staples').insert({
      user_id: user.id, name: s.name, serving_size: s.servingSize,
      calories: s.calories, protein: s.protein, carbs: s.carbs, fat: s.fat,
    })
  }, [])

  const deleteStaple = useCallback((id: string) => {
    setStaples((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (!isSupabaseConfigured) localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
    if (isSupabaseConfigured) supabase.from('staples').delete().eq('id', id)
  }, [])

  return { staples, addStaple, deleteStaple }
}

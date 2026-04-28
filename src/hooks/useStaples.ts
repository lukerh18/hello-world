import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Staple {
  id: string
  name: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface DbRow {
  id: string
  name: string
  serving_size: string | null
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
}

function toStaple(row: DbRow): Staple {
  return {
    id: row.id,
    name: row.name,
    servingSize: row.serving_size ?? '',
    calories: row.calories ?? 0,
    protein: row.protein ?? 0,
    carbs: row.carbs ?? 0,
    fat: row.fat ?? 0,
  }
}

export function useStaples() {
  const [staples, setStaples] = useState<Staple[]>([])

  useEffect(() => {
    supabase
      .from('staples')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setStaples(data.map(toStaple))
      })
  }, [])

  const addStaple = useCallback(async (s: Omit<Staple, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('staples')
      .insert({
        user_id: user.id,
        name: s.name,
        serving_size: s.servingSize,
        calories: s.calories,
        protein: s.protein,
        carbs: s.carbs,
        fat: s.fat,
      })
      .select()
      .single()
    if (!error && data) setStaples((prev) => [...prev, toStaple(data)])
  }, [])

  const deleteStaple = useCallback(async (id: string) => {
    await supabase.from('staples').delete().eq('id', id)
    setStaples((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return { staples, addStaple, deleteStaple }
}

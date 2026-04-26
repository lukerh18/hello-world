import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface Staple {
  id: string
  name: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function useStaples() {
  const [staples, setStaples] = useLocalStorage<Staple[]>('my_staples_v1', [])

  const addStaple = useCallback((s: Omit<Staple, 'id'>) => {
    setStaples((prev) => [...prev, { ...s, id: crypto.randomUUID() }])
  }, [setStaples])

  const deleteStaple = useCallback((id: string) => {
    setStaples((prev) => prev.filter((s) => s.id !== id))
  }, [setStaples])

  return { staples, addStaple, deleteStaple }
}

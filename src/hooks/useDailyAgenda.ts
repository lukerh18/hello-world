import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AgendaRow {
  checked_ids: string[]
  is_cheat_day: boolean
}

const lsKey = (date: string) => `daily_agenda_${date}`

export function useDailyAgenda() {
  const today = new Date().toISOString().split('T')[0]
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    if (!isSupabaseConfigured) {
      try { return JSON.parse(localStorage.getItem(lsKey(today)) ?? '[]') as string[] }
      catch { return [] }
    }
    return []
  })
  const [isCheatDay, setIsCheatDay] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('daily_agenda')
      .select('checked_ids, is_cheat_day')
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCheckedIds((data as AgendaRow).checked_ids ?? [])
          setIsCheatDay((data as AgendaRow).is_cheat_day ?? false)
        }
      })
  }, [today])

  const upsert = useCallback(async (ids: string[], cheat: boolean) => {
    if (!isSupabaseConfigured) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('daily_agenda').upsert(
      { user_id: user.id, date: today, checked_ids: ids, is_cheat_day: cheat, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
  }, [today])

  const toggleItem = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      if (isSupabaseConfigured) upsert(next, isCheatDay)
      else localStorage.setItem(lsKey(today), JSON.stringify(next))
      return next
    })
  }, [isCheatDay, upsert, today])

  const checkAll = useCallback((ids: string[]) => {
    setCheckedIds((prev) => {
      const next = [...new Set([...prev, ...ids])]
      if (isSupabaseConfigured) upsert(next, isCheatDay)
      else localStorage.setItem(lsKey(today), JSON.stringify(next))
      return next
    })
  }, [isCheatDay, upsert, today])

  const toggleCheatDay = useCallback(() => {
    setIsCheatDay((prev) => {
      upsert(checkedIds, !prev)
      return !prev
    })
  }, [checkedIds, upsert])

  return {
    checkedIds,
    isCheatDay,
    isChecked: (id: string) => checkedIds.includes(id),
    toggleItem,
    checkAll,
    toggleCheatDay,
  }
}

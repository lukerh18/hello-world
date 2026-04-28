import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface JournalEntry {
  date: string
  content: string
}

const LS_KEY = 'journal_v1'

function lsRead(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as JournalEntry[] }
  catch { return [] }
}

export function useJournal() {
  const { user, isLocal } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const [history, setHistory] = useState<JournalEntry[]>(isLocal ? lsRead() : [])
  const todayContent = history.find((e) => e.date === today)?.content ?? ''

  useEffect(() => {
    if (isLocal || !user) return
    supabase
      .from('journal_entries')
      .select('date, content')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setHistory(data as JournalEntry[])
      })
  }, [user, isLocal])

  const saveToday = useCallback((content: string) => {
    const next = [{ date: today, content }, ...history.filter((e) => e.date !== today)]
    setHistory(next)
    if (isLocal) {
      localStorage.setItem(LS_KEY, JSON.stringify(next.slice(0, 60)))
      return
    }
    if (!user) return
    supabase.from('journal_entries').upsert(
      { user_id: user.id, date: today, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
  }, [user, isLocal, today, history])

  return { todayContent, history, saveToday }
}

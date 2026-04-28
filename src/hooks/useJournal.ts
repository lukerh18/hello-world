import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface JournalEntry {
  date: string
  content: string
}

export function useJournal() {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const [todayContent, setTodayContent] = useState('')
  const [history, setHistory] = useState<JournalEntry[]>([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('journal_entries')
      .select('date, content')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (!data) return
        const entries = data as JournalEntry[]
        setHistory(entries)
        const todayEntry = entries.find((e) => e.date === today)
        if (todayEntry) setTodayContent(todayEntry.content)
      })
  }, [user, today])

  const saveToday = useCallback(async (content: string) => {
    if (!user) return
    setTodayContent(content)
    await supabase.from('journal_entries').upsert(
      { user_id: user.id, date: today, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
    setHistory((prev) => {
      const next = prev.filter((e) => e.date !== today)
      return [{ date: today, content }, ...next]
    })
  }, [user, today])

  return { todayContent, history, saveToday }
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface ReadingEntry {
  date: string
  bookTitle: string
  pagesRead: number
}

const LS_KEY = 'reading_log_v1'

function lsRead(): ReadingEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as ReadingEntry[] }
  catch { return [] }
}

export function useReadingLog() {
  const { user, isLocal } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const [history, setHistory] = useState<ReadingEntry[]>(isLocal ? lsRead() : [])

  const todayEntry = history.find((e) => e.date === today) ?? null
  const recentBook = history[0]?.bookTitle ?? ''

  useEffect(() => {
    if (isLocal || !user) return
    supabase
      .from('reading_log')
      .select('date, book_title, pages_read')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (data) {
          setHistory(data.map((r) => ({
            date: r.date as string,
            bookTitle: r.book_title as string,
            pagesRead: r.pages_read as number,
          })))
        }
      })
  }, [user, isLocal])

  const logToday = useCallback((bookTitle: string, pagesRead: number) => {
    if (!bookTitle.trim()) return
    const entry: ReadingEntry = { date: today, bookTitle, pagesRead }
    const next = [entry, ...history.filter((e) => e.date !== today)]
    setHistory(next)
    if (isLocal) {
      localStorage.setItem(LS_KEY, JSON.stringify(next.slice(0, 120)))
      return
    }
    if (!user) return
    supabase.from('reading_log').upsert(
      { user_id: user.id, date: today, book_title: bookTitle, pages_read: pagesRead, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
  }, [user, isLocal, today, history])

  const totalPagesCurrentBook = (() => {
    if (!recentBook) return 0
    return history.filter((e) => e.bookTitle === recentBook).reduce((sum, e) => sum + e.pagesRead, 0)
  })()

  return { todayEntry, recentBook, history, totalPagesCurrentBook, logToday }
}

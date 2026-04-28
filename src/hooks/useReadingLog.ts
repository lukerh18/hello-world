import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface ReadingEntry {
  date: string
  bookTitle: string
  pagesRead: number
}

export function useReadingLog() {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const [todayEntry, setTodayEntry] = useState<ReadingEntry | null>(null)
  const [recentBook, setRecentBook] = useState('')
  const [history, setHistory] = useState<ReadingEntry[]>([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('reading_log')
      .select('date, book_title, pages_read')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (!data) return
        const entries: ReadingEntry[] = data.map((r) => ({
          date: r.date as string,
          bookTitle: r.book_title as string,
          pagesRead: r.pages_read as number,
        }))
        setHistory(entries)
        const today_ = entries.find((e) => e.date === today)
        if (today_) setTodayEntry(today_)
        if (entries[0]) setRecentBook(entries[0].bookTitle)
      })
  }, [user, today])

  const logToday = useCallback(async (bookTitle: string, pagesRead: number) => {
    if (!user || !bookTitle.trim()) return
    const entry: ReadingEntry = { date: today, bookTitle, pagesRead }
    setTodayEntry(entry)
    setRecentBook(bookTitle)
    await supabase.from('reading_log').upsert(
      { user_id: user.id, date: today, book_title: bookTitle, pages_read: pagesRead, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
    setHistory((prev) => {
      const next = prev.filter((e) => e.date !== today)
      return [entry, ...next]
    })
  }, [user, today])

  // Total pages read for the current book (most recent consecutive entries for same title)
  const totalPagesCurrentBook = (() => {
    if (!recentBook) return 0
    return history.filter((e) => e.bookTitle === recentBook).reduce((sum, e) => sum + e.pagesRead, 0)
  })()

  return { todayEntry, recentBook, history, totalPagesCurrentBook, logToday }
}

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export interface Citation {
  url: string
  title?: string
}

export interface QAEntry {
  id: string
  question: string
  answer: string
  citations: Citation[]
  createdAt: string
}

export function useHealthIntelligence(healthContext?: string) {
  const { session } = useAuth()
  const [history, setHistory] = useState<QAEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) { setHistoryLoading(false); return }

    supabase
      .from('health_qa')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setHistory((data ?? []).map((r) => ({
          id: r.id as string,
          question: r.question as string,
          answer: r.answer as string,
          citations: (r.citations as Citation[]) ?? [],
          createdAt: r.created_at as string,
        })))
        setHistoryLoading(false)
      })
  }, [session])

  const ask = useCallback(async (question: string): Promise<QAEntry | null> => {
    if (!session) { setError('Not signed in'); return null }
    setLoading(true)
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('ask-health', {
        body: { question, userContext: healthContext },
      })
      if (fnErr) throw new Error(fnErr.message)

      const entry: QAEntry = {
        id: crypto.randomUUID(),
        question,
        answer: data.answer as string,
        citations: (data.citations as Citation[]) ?? [],
        createdAt: new Date().toISOString(),
      }
      setHistory((prev) => [entry, ...prev])
      return entry
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get answer')
      return null
    } finally {
      setLoading(false)
    }
  }, [session, healthContext])

  return { history, historyLoading, loading, error, ask }
}

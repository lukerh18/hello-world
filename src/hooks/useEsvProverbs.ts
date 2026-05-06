import { useEffect, useMemo, useState } from 'react'

interface EsvProverbsState {
  title: string
  content: string
  copyright: string
  loading: boolean
  error: string | null
  hasApiKey: boolean
}

interface PassageResponse {
  query?: string
  passages?: string[]
  copyright?: string
}

const ESV_API_KEY = import.meta.env.VITE_ESV_API_KEY as string | undefined

export function useEsvProverbs(chapter: number) {
  const [state, setState] = useState<EsvProverbsState>({
    title: `Proverbs ${chapter}`,
    content: '',
    copyright: '',
    loading: false,
    error: null,
    hasApiKey: Boolean(ESV_API_KEY),
  })

  const query = useMemo(() => `Proverbs ${Math.min(31, Math.max(1, chapter))}`, [chapter])

  useEffect(() => {
    if (!ESV_API_KEY) {
      setState((prev) => ({
        ...prev,
        title: query,
        content: '',
        copyright: '',
        loading: false,
        error: 'ESV API key is missing.',
        hasApiKey: false,
      }))
      return
    }

    const ac = new AbortController()

    async function fetchPassage() {
      setState((prev) => ({
        ...prev,
        title: query,
        loading: true,
        error: null,
        hasApiKey: true,
      }))

      try {
        const url = new URL('https://api.esv.org/v3/passage/text/')
        url.searchParams.set('q', query)
        url.searchParams.set('include-passage-references', 'false')
        url.searchParams.set('include-footnotes', 'false')
        url.searchParams.set('include-headings', 'false')
        url.searchParams.set('include-verse-numbers', 'true')
        url.searchParams.set('include-first-verse-numbers', 'true')
        url.searchParams.set('include-short-copyright', 'false')
        url.searchParams.set('include-copyright', 'true')
        url.searchParams.set('line-length', '0')

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: { Authorization: `Token ${ESV_API_KEY}` },
          signal: ac.signal,
        })
        if (!res.ok) throw new Error(`ESV request failed (${res.status})`)
        const data = (await res.json()) as PassageResponse
        const passage = data.passages?.[0]?.trim() ?? ''
        if (!passage) throw new Error('No passage text returned.')
        setState({
          title: data.query ?? query,
          content: passage,
          copyright: data.copyright ?? '',
          loading: false,
          error: null,
          hasApiKey: true,
        })
      } catch (error) {
        if (ac.signal.aborted) return
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load Proverbs passage.',
        }))
      }
    }

    fetchPassage()
    return () => ac.abort()
  }, [query])

  return state
}

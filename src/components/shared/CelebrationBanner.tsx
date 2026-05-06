import { useEffect } from 'react'

export interface CelebrationMessage {
  id: number
  title: string
  detail?: string
  tone?: 'warm' | 'success' | 'big'
}

interface CelebrationBannerProps {
  message: CelebrationMessage | null
  onDone: () => void
}

export function CelebrationBanner({ message, onDone }: CelebrationBannerProps) {
  useEffect(() => {
    if (!message) return
    const timeout = window.setTimeout(onDone, message.tone === 'big' ? 4200 : 3200)
    return () => window.clearTimeout(timeout)
  }, [message, onDone])

  if (!message) return null

  const toneClass = message.tone === 'big'
    ? 'border-accent/50 bg-accent/15 glow-accent'
    : message.tone === 'success'
      ? 'border-success/35 bg-success/10 glow-success'
      : 'border-amber-300/25 bg-surface-800'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-fade-up rounded-2xl border px-4 py-3 card-highlight ${toneClass}`}
    >
      <p className="text-sm font-semibold text-slate-100">{message.title}</p>
      {message.detail && (
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message.detail}</p>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface RestTimerProps {
  seconds: number
  onDismiss: () => void
  onDone?: () => void
  compact?: boolean
}

export function RestTimer({ seconds, onDismiss, onDone, compact = false }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onDone?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [seconds])

  const pct = (remaining / seconds) * 100

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`
  }, [])

  return (
    <div className={`flex items-center gap-3 bg-surface-700 rounded-xl px-4 py-2.5 ${compact ? '' : 'mt-2'}`}>
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#334155" strokeWidth="4" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={remaining === 0 ? '#22c55e' : '#f97316'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-slate-100 leading-none">{formatTime(remaining)}</span>
          <span className="text-[10px] text-slate-500 mt-1">{remaining === 0 ? 'Done!' : 'Rest'}</span>
        </div>
      </div>
      <div className="flex-1 ml-2">
        <p className="text-sm font-medium text-slate-300">
          {remaining === 0 ? 'Ready for next set!' : 'Rest period'}
        </p>
        <p className="text-xs text-slate-500">{seconds}s total</p>
      </div>
      <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 p-1">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

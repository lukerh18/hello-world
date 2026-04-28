import { useEffect } from 'react'
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useWeeklyReview } from '../../hooks/useWeeklyReview'
import { useBodyMetrics } from '../../hooks/useBodyMetrics'
import { useWorkoutLog } from '../../hooks/useWorkoutLog'
import { useNutritionLog } from '../../hooks/useNutritionLog'
import { useSettings } from '../../hooks/useSettings'

interface SectionConfig {
  title: string
  color: string
  bg: string
  border: string
}

const SECTION_STYLES: Record<string, SectionConfig> = {
  "What's Working":        { title: "What's Working",        color: 'text-success',   bg: 'bg-success/10',   border: 'border-success/25' },
  "Needs Attention":       { title: "Needs Attention",        color: 'text-warn',      bg: 'bg-warn/10',      border: 'border-warn/25' },
  "This Week's Priority":  { title: "This Week's Priority",   color: 'text-accent',    bg: 'bg-accent/10',    border: 'border-accent/25' },
  "Science-Based Insight": { title: "Science-Based Insight",  color: 'text-blue-400',  bg: 'bg-blue-400/10',  border: 'border-blue-400/25' },
}

function parseReview(text: string): { title: string; content: string }[] {
  return text
    .split('###')
    .slice(1)
    .map((section) => {
      const lines = section.trim().split('\n')
      return { title: lines[0].trim(), content: lines.slice(1).join('\n').trim() }
    })
    .filter((s) => s.title && s.content)
}

interface WeeklyReviewProps {
  healthContext: string
  weekNumber: number
  phase: string
  latestWeight: number
}

export function WeeklyReview({ healthContext, weekNumber, phase, latestWeight }: WeeklyReviewProps) {
  const { metrics } = useBodyMetrics()
  const { logs: workoutLogs } = useWorkoutLog()
  const { logs: nutritionLogs } = useNutritionLog()
  const { settings } = useSettings()

  const { review, generatedAt, loading, error, generate, loadCache } = useWeeklyReview(
    healthContext, weekNumber, phase, latestWeight, metrics, workoutLogs, nutritionLogs
  )

  useEffect(() => { loadCache() }, [loadCache])

  const sections = review ? parseReview(review) : []
  const generatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null

  // Weekly review now runs via edge function — no client-side key required.
  // Show prompt if the edge function secret is not yet configured (API returns an error in that case).
  const _ = settings // imported for potential future per-user key override

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-accent" />
          <p className="text-sm font-semibold text-slate-200">Weekly Coaching Review</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light disabled:opacity-40 transition-colors"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating...' : review ? 'Regenerate' : 'Generate Review'}
        </button>
      </div>

      {generatedLabel && !loading && (
        <p className="text-[10px] text-slate-600">Last generated {generatedLabel}</p>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/25 rounded-xl px-4 py-3">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-surface-800 rounded-2xl border border-surface-600 p-8 text-center">
          <SparklesIcon className="w-6 h-6 text-accent mx-auto mb-2 animate-pulse" />
          <p className="text-xs text-slate-400">Analyzing your week with Claude Sonnet...</p>
          <p className="text-[10px] text-slate-600 mt-1">This takes ~10 seconds</p>
        </div>
      )}

      {!loading && sections.length > 0 && sections.map(({ title, content }) => {
        const style = SECTION_STYLES[title] ?? { title, color: 'text-slate-300', bg: 'bg-surface-700', border: 'border-surface-600' }
        return (
          <div key={title} className={`rounded-2xl border p-4 space-y-2 ${style.bg} ${style.border} card-highlight`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${style.color}`}>{title}</p>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        )
      })}

      {!loading && !review && !error && (
        <div className="bg-surface-800 rounded-2xl border border-surface-600 p-8 text-center space-y-3">
          <SparklesIcon className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">No review generated yet for this week.</p>
          <button
            onClick={generate}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors"
          >
            Generate This Week's Review
          </button>
        </div>
      )}
    </div>
  )
}

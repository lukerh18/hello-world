import { useNavigate } from 'react-router-dom'
import { BoltIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { Button } from '../shared/Button'
import { useMovementLog } from '../../hooks/useMovementLog'
import { useMovementPlan } from '../../hooks/useMovementPlan'

interface MovementSummaryCardProps {
  compact?: boolean
}

export function MovementSummaryCard({ compact = false }: MovementSummaryCardProps) {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const { plan, isQuietNow } = useMovementPlan(today)
  const { getSummaryForDate, getMovementStreak } = useMovementLog()
  const summary = getSummaryForDate(today)
  const streak = getMovementStreak(today)
  const breaksPct = Math.min(100, Math.round((summary.breaks / plan.targetBreaks) * 100))
  const minutesPct = Math.min(100, Math.round((summary.minutes / plan.targetMinutes) * 100))

  return (
    <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="w-3.5 h-3.5 text-accent" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">Movement</p>
        </div>
        <button onClick={() => navigate('/workout?tab=move')} className="text-xs text-accent font-semibold">
          Open Move
        </button>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-100">
            {plan.mode === 'heavy_workout' ? 'Heavy workout day' : 'Light movement day'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {summary.breaks}/{plan.targetBreaks} breaks / {summary.minutes}/{plan.targetMinutes} min
          </p>
          {streak > 0 && (
            <p className="text-[10px] text-slate-500 mt-1">{streak}-day movement momentum</p>
          )}
        </div>
        <Button size="sm" variant={summary.breaks >= plan.targetBreaks ? 'secondary' : 'primary'} onClick={() => navigate('/workout?tab=move')}>
          {summary.breaks > 0 ? 'Log more' : 'Log'}
        </Button>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-700 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>Breaks</span>
              <span>{breaksPct}%</span>
            </div>
            <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${breaksPct}%` }} />
            </div>
          </div>
          <div className="bg-surface-700 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>Minutes</span>
              <span>{minutesPct}%</span>
            </div>
            <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: `${minutesPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {isQuietNow && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-surface-700 rounded-xl px-3 py-2">
          <BoltIcon className="w-3.5 h-3.5 text-slate-500" />
          Movement pings are paused for meetings.
        </div>
      )}

    </div>
  )
}

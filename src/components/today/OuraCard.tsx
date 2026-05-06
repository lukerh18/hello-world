import { useEffect } from 'react'
import { HeartIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useOuraData } from '../../hooks/useOuraData'

function scoreColor(n: number) {
  if (n >= 85) return 'text-success'
  if (n >= 70) return 'text-accent'
  if (n >= 55) return 'text-warn'
  return 'text-danger'
}

function scoreBg(n: number) {
  if (n >= 85) return 'bg-success/10'
  if (n >= 70) return 'bg-accent/10'
  if (n >= 55) return 'bg-warn/10'
  return 'bg-danger/10'
}

function fmtHours(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function trainRec(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Optimal recovery · Push hard today', color: 'text-success' }
  if (score >= 70) return { label: 'Good recovery · Train as planned', color: 'text-success' }
  if (score >= 60) return { label: 'Moderate recovery · Consider lighter intensity', color: 'text-warn' }
  if (score >= 50) return { label: 'Low readiness · Active recovery only', color: 'text-orange-400' }
  return { label: 'Poor recovery · Rest and prioritize sleep tonight', color: 'text-danger' }
}

export function OuraCard({ token }: { token: string }) {
  const { data, refresh, hasData, isLoading, error } = useOuraData(token)

  useEffect(() => {
    refresh()
  }, [refresh])

  // Skeleton — loading with no cached data yet
  if (isLoading && !hasData) {
    return (
      <div className="bg-surface-800 rounded-2xl overflow-hidden animate-pulse">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <div className="w-4 h-4 rounded-full bg-surface-700" />
          <div className="h-3 w-20 bg-surface-700 rounded" />
        </div>
        <div className="mx-4 h-16 bg-surface-700 rounded-xl mb-3" />
        <div className="grid grid-cols-2 gap-2 mx-4 mb-3">
          <div className="h-24 bg-surface-700 rounded-xl" />
          <div className="h-24 bg-surface-700 rounded-xl" />
        </div>
        <div className="h-4 mx-4 mb-3 bg-surface-700 rounded" />
      </div>
    )
  }

  // Error with no data to fall back on
  if (error && !hasData) {
    return (
      <div className="bg-surface-800 rounded-2xl px-4 py-4 flex items-center gap-3">
        <ExclamationCircleIcon className="w-5 h-5 text-danger shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-300">Oura unavailable</p>
          <p className="text-xs text-slate-500 mt-0.5">{error}</p>
        </div>
      </div>
    )
  }

  if (!hasData) return null

  const { readiness, sleep, activity } = data
  const rec = readiness ? trainRec(readiness.score) : null

  return (
    <div className="bg-surface-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <HeartIcon className="w-4 h-4 text-danger" />
        <span className="text-sm font-semibold text-slate-200">Recovery</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-600 uppercase tracking-wide">
          {isLoading && <ArrowPathIcon className="w-3 h-3 animate-spin" />}
          Oura · Today
        </span>
      </div>

      {/* Readiness hero */}
      {readiness && (
        <div className={`mx-4 rounded-xl px-4 py-3 mb-3 ${scoreBg(readiness.score)}`}>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-4xl font-bold tabular-nums ${scoreColor(readiness.score)}`}>
              {readiness.score}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Readiness</span>
          </div>
          {rec && <p className={`text-xs font-medium ${rec.color}`}>{rec.label}</p>}
        </div>
      )}

      {/* Sleep + Activity columns */}
      <div className="grid grid-cols-2 gap-2 mx-4 mb-3">
        {sleep && (
          <div className={`rounded-xl px-3 py-2.5 ${scoreBg(sleep.score)}`}>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className={`text-2xl font-bold tabular-nums ${scoreColor(sleep.score)}`}>{sleep.score}</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-wide">Sleep</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-300 font-medium">{fmtHours(sleep.total_sleep_duration)}</p>
              {sleep.deep_sleep_duration > 0 && (
                <p className="text-[10px] text-slate-500">Deep {fmtHours(sleep.deep_sleep_duration)}</p>
              )}
              {sleep.rem_sleep_duration > 0 && (
                <p className="text-[10px] text-slate-500">REM {fmtHours(sleep.rem_sleep_duration)}</p>
              )}
              {sleep.average_hrv > 0 && (
                <p className="text-[10px] text-slate-500">HRV {Math.round(sleep.average_hrv)} ms</p>
              )}
            </div>
          </div>
        )}
        {activity && (
          <div className={`rounded-xl px-3 py-2.5 ${scoreBg(activity.score)}`}>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className={`text-2xl font-bold tabular-nums ${scoreColor(activity.score)}`}>{activity.score}</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-wide">Activity</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-300 font-medium">{activity.steps.toLocaleString()} steps</p>
              <p className="text-[10px] text-slate-500">{activity.active_calories} active kcal</p>
            </div>
          </div>
        )}
      </div>

      {/* Body stats footer */}
      {readiness && (
        <div className="flex items-center gap-4 px-4 pb-3 text-[10px] text-slate-500 flex-wrap">
          <span>
            RHR <span className="text-slate-400">{readiness.resting_heart_rate} bpm</span>
          </span>
          {readiness.hrv_balance > 0 && (
            <span>
              HRV balance <span className="text-slate-400">{readiness.hrv_balance}</span>
            </span>
          )}
          {Math.abs(readiness.body_temperature_deviation) >= 0.2 && (
            <span className={Math.abs(readiness.body_temperature_deviation) >= 0.5 ? 'text-warn' : 'text-slate-400'}>
              Temp {readiness.body_temperature_deviation > 0 ? '+' : ''}
              {readiness.body_temperature_deviation.toFixed(1)}°C
            </span>
          )}
        </div>
      )}
    </div>
  )
}

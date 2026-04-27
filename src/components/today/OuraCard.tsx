import { useEffect } from 'react'
import { HeartIcon } from '@heroicons/react/24/outline'
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

export function OuraCard({ token }: { token: string }) {
  const { data, refresh, hasData, isLoading } = useOuraData(token)

  useEffect(() => {
    refresh()
  }, [refresh])

  if (isLoading && !hasData) {
    return (
      <div className="bg-surface-800 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-700 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 bg-surface-700 rounded animate-pulse" />
          <div className="h-2 w-36 bg-surface-700 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!hasData) return null

  const { readiness, sleep, activity } = data

  return (
    <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <HeartIcon className="w-4 h-4 text-danger" />
        <span className="text-sm font-semibold text-slate-200">Recovery</span>
        <span className="ml-auto text-[10px] text-slate-600 uppercase tracking-wide">Oura · Today</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {readiness && (
          <div className={`rounded-xl px-2.5 py-2 ${scoreBg(readiness.score)}`}>
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">Readiness</p>
            <p className={`text-2xl font-bold leading-tight ${scoreColor(readiness.score)}`}>{readiness.score}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">HRV {readiness.hrv_balance}</p>
          </div>
        )}
        {sleep && (
          <div className={`rounded-xl px-2.5 py-2 ${scoreBg(sleep.score)}`}>
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">Sleep</p>
            <p className={`text-2xl font-bold leading-tight ${scoreColor(sleep.score)}`}>{sleep.score}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{fmtHours(sleep.total_sleep_duration)}</p>
          </div>
        )}
        {activity && (
          <div className={`rounded-xl px-2.5 py-2 ${scoreBg(activity.score)}`}>
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">Activity</p>
            <p className={`text-2xl font-bold leading-tight ${scoreColor(activity.score)}`}>{activity.score}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{activity.steps.toLocaleString()} steps</p>
          </div>
        )}
      </div>

      {(readiness || activity) && (
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          {readiness && (
            <span>
              RHR <span className="text-slate-400">{readiness.resting_heart_rate} bpm</span>
            </span>
          )}
          {readiness && Math.abs(readiness.body_temperature_deviation) >= 0.3 && (
            <span className={Math.abs(readiness.body_temperature_deviation) >= 0.5 ? 'text-warn' : ''}>
              Temp {readiness.body_temperature_deviation > 0 ? '+' : ''}
              {readiness.body_temperature_deviation.toFixed(1)}°C
            </span>
          )}
          {activity && <span>{activity.active_calories} active kcal</span>}
        </div>
      )}

      {readiness && readiness.score < 70 && (
        <p className="text-xs text-warn bg-warn/5 rounded-lg px-2.5 py-1.5">
          {readiness.score < 55
            ? 'Low readiness — prioritize rest, light movement, and early sleep tonight.'
            : 'Moderate readiness — consider lighter intensity or active recovery today.'}
        </p>
      )}
    </div>
  )
}

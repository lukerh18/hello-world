import { useNavigate } from 'react-router-dom'
import { ArrowRightIcon, CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import type { StreakDayStatus, WeeklyStreakLane } from '../../hooks/useWeeklyStreaks'
import { ABSTAIN_RULES, useFastingAbstain } from '../../hooks/useFastingAbstain'

interface WeeklyStreakCardProps {
  lanes: WeeklyStreakLane[]
  focusLane: WeeklyStreakLane
  score: number
  maxScore: number
  countdown: {
    targetDate: string
    daysRemaining: number
    currentWeight: number
    targetWeight: number
    poundsRemaining: number
    requiredWeeklyPace: number
  }
  loading?: boolean
}

const STATUS_LABELS: Record<StreakDayStatus, string> = {
  complete: 'Complete',
  protected_miss: 'Protected miss',
  missed: 'Missed',
  pending: 'Pending',
  at_risk: 'At risk',
}

function dayClass(status: StreakDayStatus): string {
  switch (status) {
    case 'complete':
      return 'bg-success text-surface-950 border-success'
    case 'protected_miss':
      return 'bg-warn/15 text-warn border-warn/40'
    case 'missed':
      return 'bg-danger/20 text-danger border-danger/50'
    case 'at_risk':
      return 'bg-accent/15 text-accent border-accent/50 animate-pulse'
    case 'pending':
      return 'bg-surface-700 text-slate-500 border-surface-600'
  }
}

function laneTone(lane: WeeklyStreakLane): string {
  if (lane.broken) return 'border-danger/35 bg-danger/5'
  if (lane.todayStatus === 'at_risk') return 'border-accent/40 bg-accent/5'
  if (lane.todayStatus === 'complete') return 'border-success/25 bg-success/5'
  return 'border-surface-700 bg-surface-800'
}

function formatTargetDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function WeeklyStreakCard({
  lanes,
  focusLane,
  score,
  maxScore,
  countdown,
  loading = false,
}: WeeklyStreakCardProps) {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const { day: fastingDay, setKitchenClosed, toggleRule } = useFastingAbstain(today)
  const completedToday = lanes.filter((lane) => lane.todayStatus === 'complete').length
  const activeLanes = lanes.filter((lane) => !lane.broken).length
  const allDoneToday = completedToday === lanes.length
  const footerActionLane = allDoneToday || focusLane.id !== 'abstain' ? focusLane : null
  const scorePct = Math.round((score / Math.max(1, maxScore)) * 100)

  if (loading) {
    return (
      <div className="bg-surface-800 rounded-2xl px-4 py-4 space-y-3 border border-surface-700">
        <div className="h-4 w-32 bg-surface-700 rounded animate-pulse" />
        <div className="h-16 bg-surface-700 rounded-xl animate-pulse" />
        <div className="h-16 bg-surface-700 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <section className="bg-surface-800 rounded-2xl px-4 py-4 space-y-3 border border-accent/15 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <ShieldCheckIcon className="w-4 h-4 text-accent" />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">
              Body Comp Game
            </p>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">
            {scorePct >= 85 ? 'High-leverage day' : `${activeLanes}/3 tracks still alive`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            July 31 target. One protected miss per track each week.
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-accent tabular-nums">{score}</p>
          <p className="text-[10px] text-slate-600">/ {maxScore} today</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface-700 px-3 py-2">
          <p className="text-lg font-bold text-slate-100 tabular-nums">{countdown.daysRemaining}</p>
          <p className="text-[10px] text-slate-500">days to {formatTargetDate(countdown.targetDate)}</p>
        </div>
        <div className="rounded-xl bg-surface-700 px-3 py-2">
          <p className="text-lg font-bold text-slate-100 tabular-nums">{countdown.poundsRemaining.toFixed(1)}</p>
          <p className="text-[10px] text-slate-500">lbs to {countdown.targetWeight}</p>
        </div>
        <div className="rounded-xl bg-surface-700 px-3 py-2">
          <p className="text-lg font-bold text-slate-100 tabular-nums">{countdown.requiredWeeklyPace.toFixed(1)}</p>
          <p className="text-[10px] text-slate-500">lbs / week</p>
        </div>
      </div>

      <div className="space-y-2">
        {lanes.map((lane) => (
          <div key={lane.id} className={`rounded-xl border px-3 py-3 space-y-2 ${laneTone(lane)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {lane.todayStatus === 'complete' && <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />}
                  <p className="text-sm font-semibold text-slate-100">{lane.title}</p>
                  <span className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    {STATUS_LABELS[lane.todayStatus]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{lane.requirement}</p>
              </div>
              <p className="text-xs font-semibold text-slate-300 tabular-nums">
                {lane.score}/{lane.maxScore} pts
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {lane.days.map((day) => (
                <div key={day.date} className="flex-1">
                  <div
                    className={`h-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${dayClass(day.status)}`}
                    title={`${day.label}: ${STATUS_LABELS[day.status]}`}
                    aria-label={`${lane.title} ${day.label}: ${STATUS_LABELS[day.status]}`}
                  >
                    {day.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-300">{lane.detail}</p>
                {lane.secondaryDetail && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{lane.secondaryDetail}</p>
                )}
              </div>
              {lane.protectedMissUsed && !lane.broken && (
                <span className="shrink-0 rounded-full bg-warn/10 border border-warn/25 px-2 py-1 text-[10px] font-semibold text-warn">
                  Miss used
                </span>
              )}
            </div>

            {lane.id === 'abstain' && (
              <div className="rounded-xl bg-surface-900/40 border border-surface-700 px-3 py-2 space-y-2">
                <button
                  onClick={() => setKitchenClosed(!fastingDay.kitchenClosed)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                    fastingDay.kitchenClosed
                      ? 'bg-success/10 text-success'
                      : 'bg-surface-700 text-slate-300'
                  }`}
                >
                  <span>Kitchen closed by 6pm</span>
                  <span>{fastingDay.kitchenClosed ? 'Done' : 'Mark'}</span>
                </button>
                {ABSTAIN_RULES.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => toggleRule(rule.id)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                      fastingDay.abstain[rule.id]
                        ? 'bg-success/10 text-success'
                        : 'bg-surface-700 text-slate-300'
                    }`}
                  >
                    <span>{rule.label}</span>
                    <span>{fastingDay.abstain[rule.id] ? 'Done' : 'Mark'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {footerActionLane && (
        <button
          onClick={() => navigate(allDoneToday ? '/progress' : footerActionLane.href)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          {allDoneToday ? 'Review progress' : footerActionLane.nextAction}
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      )}
    </section>
  )
}

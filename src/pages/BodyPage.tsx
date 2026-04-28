import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import { useCurrentWeek } from '../hooks/useCurrentWeek'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { useHabits } from '../hooks/useHabits'
import { useGoals } from '../hooks/useGoals'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import { OuraCard } from '../components/today/OuraCard'
import { Button } from '../components/shared/Button'
import { getWorkoutForDay } from '../data/program'
import { getDailyChore } from '../data/habits'
import { NUTRITION_TARGETS } from '../data/userProfile'
import { celebrateSingle } from '../utils/celebrate'
import {
  BoltIcon, CheckCircleIcon as CheckOutline,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import type { DayOfWeek } from '../types'

function getDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  return days[new Date().getDay()]
}

export default function BodyPage() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const startDate = settings.programStartDate || new Date().toISOString().split('T')[0]
  const { week, phase } = useCurrentWeek(startDate)
  const { getTodayLog } = useWorkoutLog()
  const { getDayTotals } = useNutritionLog()
  const { isChoreDone, toggleChore } = useHabits()
  const { current: goals, history: goalHistory, updateGoal } = useGoals()
  const { latestWeight } = useBodyMetrics()

  const today = new Date().toISOString().split('T')[0]
  const todayLog = getTodayLog()
  const totals = getDayTotals(today)
  const todayWorkout = getWorkoutForDay(getDayOfWeek())
  const chore = getDailyChore()

  const calPct   = Math.min(100, Math.round((totals.calories / NUTRITION_TARGETS.calories) * 100))
  const protPct  = Math.min(100, Math.round((totals.protein  / NUTRITION_TARGETS.protein)  * 100))
  const carbPct  = Math.min(100, Math.round((totals.carbs    / NUTRITION_TARGETS.carbs)    * 100))
  const fatPct   = Math.min(100, Math.round((totals.fat      / NUTRITION_TARGETS.fat)      * 100))

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const [showGoalEdit, setShowGoalEdit] = useState(false)
  const [goalDraft, setGoalDraft] = useState(goals.body)

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-3">

      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-accent">Body</h1>
          <p className="text-xs text-slate-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">{latestWeight ? `${latestWeight} lbs` : '—'}</p>
          <p className="text-[10px] text-slate-600">Week {week} · {phase.label}</p>
        </div>
      </div>

      {/* Body goal */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3">
        <p className="text-[10px] text-accent uppercase tracking-widest font-semibold mb-2">Body Goal</p>
        {showGoalEdit ? (
          <div className="space-y-2">
            <textarea
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              rows={2}
              autoFocus
              placeholder="e.g. Hit 185 lbs, build muscle, improve stamina"
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:border-accent"
            />
            <div className="flex gap-2">
              <button onClick={() => { updateGoal('body', goalDraft); setShowGoalEdit(false) }}
                className="flex-1 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold">Save</button>
              <button onClick={() => setShowGoalEdit(false)}
                className="px-3 py-1.5 rounded-xl bg-surface-700 text-slate-400 text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setGoalDraft(goals.body); setShowGoalEdit(true) }} className="text-left w-full group flex items-start gap-1.5">
            <span className={goals.body ? 'text-slate-200 text-sm' : 'text-slate-600 italic text-sm'}>
              {goals.body || 'Tap to set your body goal…'}
            </span>
          </button>
        )}
        {goalHistory.body.length > 1 && !showGoalEdit && (
          <p className="text-[10px] text-slate-700 mt-1">{goalHistory.body.length - 1} previous goals</p>
        )}
      </div>

      {/* Workout */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
        <div className="flex items-center gap-1.5 mb-1">
          <BoltIcon className="w-3.5 h-3.5 text-accent" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">Workout</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-100">
              {todayWorkout.isRest ? '😴 Rest Day' : todayWorkout.label}
            </p>
            {!todayWorkout.isRest && (
              <p className="text-xs text-slate-500 mt-0.5">{todayWorkout.focusLabel}</p>
            )}
          </div>
          {!todayWorkout.isRest && (
            todayLog?.completedAt
              ? <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">✓ Done</span>
              : <Button size="sm" onClick={() => navigate('/workout')}>{todayLog ? 'Continue' : 'Start'}</Button>
          )}
        </div>

        {todayLog && !todayLog.completedAt && (
          <div className="bg-surface-700 rounded-xl px-3 py-2">
            <p className="text-xs text-slate-400">
              {todayLog.exercises.reduce((s, e) => s + e.sets.filter(set => set.completed).length, 0)}
              {' / '}
              {todayLog.exercises.reduce((s, e) => s + e.sets.length, 0)} sets done
            </p>
          </div>
        )}
      </div>

      {/* Nutrition */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">Nutrition</p>
          <button onClick={() => navigate('/nutrition')} className="text-xs text-accent font-semibold">Log food →</button>
        </div>

        {[
          { label: 'Calories', value: totals.calories, target: NUTRITION_TARGETS.calories, unit: 'kcal', pct: calPct,  color: 'bg-accent' },
          { label: 'Protein',  value: totals.protein,  target: NUTRITION_TARGETS.protein,  unit: 'g',    pct: protPct, color: 'bg-blue-400' },
          { label: 'Carbs',    value: totals.carbs,    target: NUTRITION_TARGETS.carbs,    unit: 'g',    pct: carbPct, color: 'bg-amber-400' },
          { label: 'Fat',      value: totals.fat,      target: NUTRITION_TARGETS.fat,      unit: 'g',    pct: fatPct,  color: 'bg-orange-400' },
        ].map(({ label, value, target, unit, pct, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 w-14 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 w-24 text-right shrink-0">
              {Math.round(value)} / {target}{unit}
            </span>
          </div>
        ))}
      </div>

      {/* House chore */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-2">House</p>
        <div className="flex items-center gap-3">
          <button onClick={() => { toggleChore(); if (!isChoreDone) celebrateSingle() }} className="flex-shrink-0">
            {isChoreDone ? <CheckSolid className="w-5 h-5 text-success" /> : <CheckOutline className="w-5 h-5 text-slate-600" />}
          </button>
          <span className="text-base">{chore.icon}</span>
          <span className={`text-sm flex-1 ${isChoreDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>{chore.name}</span>
        </div>
      </div>

      {/* Oura */}
      {settings.ouraToken && (
        <div className="bg-surface-800 rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-2">Recovery</p>
          <OuraCard token={settings.ouraToken} />
        </div>
      )}

    </div>
  )
}

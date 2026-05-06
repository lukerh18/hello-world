import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentWeek } from '../hooks/useCurrentWeek'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import { useSettings } from '../hooks/useSettings'
import { useMealReminders } from '../hooks/useMealReminders'
import { useWeeklyStreaks } from '../hooks/useWeeklyStreaks'
import { getWorkoutForDay } from '../data/program'
import { DEFAULT_USER_PROFILE, NUTRITION_TARGETS } from '../data/userProfile'
import { OuraCard } from '../components/today/OuraCard'
import { SupplementCard } from '../components/today/SupplementCard'
import { WeeklyStreakCard } from '../components/today/WeeklyStreakCard'
import { NutritionSummary } from '../components/nutrition/NutritionSummary'
import { Button } from '../components/shared/Button'
import {
  ScaleIcon, XMarkIcon, BoltIcon, FireIcon, HeartIcon, BellIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import type { DayOfWeek } from '../types'

function usePullToRefresh(onRefresh: () => Promise<void>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState(0) // 0=hidden, >0=pull px, -1=refreshing

  const isRefreshingRef = useRef(false)
  const stableRefresh = useRef(onRefresh)
  stableRefresh.current = onRefresh

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const THRESHOLD = 72
    let startY = 0
    let active = false
    let pullY = 0

    function findScrollParent(): HTMLElement | null {
      let node: HTMLElement | null = el!.parentElement
      while (node) {
        if (window.getComputedStyle(node).overflowY !== 'visible') return node
        node = node.parentElement
      }
      return null
    }

    function onStart(e: TouchEvent) {
      if (isRefreshingRef.current) return
      startY = e.touches[0].clientY
      active = false
      pullY = 0
    }

    function onMove(e: TouchEvent) {
      if (isRefreshingRef.current) return
      const scrollParent = findScrollParent()
      if (scrollParent && scrollParent.scrollTop > 0) return
      const dy = e.touches[0].clientY - startY
      if (dy <= 0) {
        if (active) { active = false; pullY = 0; setIndicator(0) }
        return
      }
      e.preventDefault()
      active = true
      pullY = Math.min(dy * 0.4, THRESHOLD)
      setIndicator(pullY)
    }

    function onEnd() {
      if (!active) return
      active = false
      if (pullY >= THRESHOLD && !isRefreshingRef.current) {
        isRefreshingRef.current = true
        setIndicator(-1)
        stableRefresh.current().finally(() => {
          isRefreshingRef.current = false
          pullY = 0
          setIndicator(0)
        })
      } else {
        pullY = 0
        setIndicator(0)
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [])

  return { containerRef, indicator }
}

function getDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const todayStr = new Date().toISOString().split('T')[0]
  return days[new Date(todayStr + 'T12:00:00').getDay()]
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface TodayPageProps { onOpenSettings?: () => void }

export default function TodayPage({ onOpenSettings }: TodayPageProps) {
  const navigate = useNavigate()
  const { settings, loading: settingsLoading } = useSettings()
  const startDate = settings.programStartDate || new Date().toISOString().split('T')[0]
  const { week, phase } = useCurrentWeek(startDate)
  const { getTodayLog, getLogByDate, loading: workoutLoading, refresh: refreshWorkout } = useWorkoutLog()
  const { getDayTotals, getByDate, loading: nutritionLoading, refresh: refreshNutrition } = useNutritionLog()
  const { latestWeight, metrics, addWeightEntry, refresh: refreshMetrics } = useBodyMetrics()
  const { getDueReminders } = useMealReminders()

  const handleRefresh = useCallback(async () => {
    refreshNutrition()
    refreshWorkout()
    refreshMetrics()
    await new Promise((resolve) => setTimeout(resolve, 1200))
  }, [refreshNutrition, refreshWorkout, refreshMetrics])

  const { containerRef, indicator } = usePullToRefresh(handleRefresh)

  const [weightInput, setWeightInput] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const todayLog = getTodayLog()
  const todayWorkout = getWorkoutForDay(getDayOfWeek())
  const totals = getDayTotals(today)
  const weeklyStreaks = useWeeklyStreaks({
    getDayTotals,
    getLogByDate,
    loading: nutritionLoading || workoutLoading,
  })

  const todayMeals = getByDate(today)
  const loggedMealIds = new Set(todayMeals.meals.filter((m) => m.foods.length > 0).map((m) => m.id))
  const nextUnloggedMeal = todayMeals.meals.find((meal) => meal.foods.length === 0)
  const dueReminders = getDueReminders(loggedMealIds)

  const lastWeightDate = metrics.weightLog[metrics.weightLog.length - 1]?.date
  const daysSinceWeight = lastWeightDate
    ? Math.floor((Date.now() - new Date(lastWeightDate + 'T12:00:00').getTime()) / 86400000)
    : 999
  const weightSnoozed = localStorage.getItem('weight_prompt_snoozed') ?? ''
  const showWeightPrompt = daysSinceWeight >= 7 && today > weightSnoozed

  const handleWeightLog = () => {
    const w = parseFloat(weightInput)
    if (!w) return
    addWeightEntry({ date: today, weight: w })
    setWeightInput('')
  }

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const lbsToGoal = Math.max(0, (latestWeight || 0) - DEFAULT_USER_PROFILE.goalWeightLbs)

  return (
    <div ref={containerRef} className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-4">

      {/* Pull-to-refresh indicator */}
      {indicator !== 0 && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-150"
          style={{ height: indicator === -1 ? 40 : indicator }}
        >
          <div className={`w-5 h-5 rounded-full border-2 border-accent border-t-transparent ${indicator === -1 ? 'animate-spin' : 'opacity-60'}`} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <p className="text-slate-500 text-sm">{dayName}, {dateStr}</p>
          <h1 className="text-2xl font-bold text-gradient mt-0.5">{getGreeting()}, Luke</h1>
          <p className="text-xs text-slate-600 mt-1">
            Week {week} · {phase.label}
          </p>
          {(latestWeight || 0) > 0 && (
            <p className="text-xs text-slate-600 mt-0.5">
              <span className="text-slate-400">{latestWeight} lbs</span>
              {lbsToGoal > 0
                ? <> · <span className="text-slate-400">{lbsToGoal} lbs to goal</span></>
                : <span className="text-success"> · Goal reached</span>}
            </p>
          )}
        </div>
      </div>

      <WeeklyStreakCard
        lanes={weeklyStreaks.lanes}
        focusLane={weeklyStreaks.focusLane}
        score={weeklyStreaks.score}
        maxScore={weeklyStreaks.maxScore}
        countdown={weeklyStreaks.countdown}
        loading={weeklyStreaks.loading}
      />

      {/* Weekly weigh-in */}
      {showWeightPrompt && (
        <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScaleIcon className="w-4 h-4 text-accent" />
              <p className="text-sm font-semibold text-slate-200">Weekly weigh-in</p>
            </div>
            <button
              onClick={() => localStorage.setItem('weight_prompt_snoozed', today)}
              className="text-slate-600 hover:text-slate-400"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {daysSinceWeight >= 999 ? 'No weight logged yet.' : `Last logged ${daysSinceWeight} days ago.`}
          </p>
          <div className="flex gap-2">
            <input
              type="number" inputMode="decimal" step="0.1" min="100" max="400"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWeightLog()}
              placeholder={latestWeight ? String(latestWeight) : '190.0'}
              className="flex-1 bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent"
            />
            <span className="flex items-center text-xs text-slate-500">lbs</span>
            <button
              onClick={handleWeightLog}
              disabled={!weightInput}
              className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-40"
            >
              Log
            </button>
          </div>
        </div>
      )}

      {/* Nutrition Today */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <FireIcon className="w-3.5 h-3.5 text-accent" />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">Nutrition</p>
          </div>
          <button onClick={() => navigate('/nutrition')} className="text-xs text-accent font-semibold">
            {nextUnloggedMeal ? `Log ${nextUnloggedMeal.name} →` : 'View log'}
          </button>
        </div>

        <NutritionSummary totals={totals} targets={NUTRITION_TARGETS} title="Today's Targets" embedded />

        <div className="grid grid-cols-2 gap-2 pt-1">
          {todayMeals.meals.map((meal) => {
            const isLogged = meal.foods.length > 0
            const calories = meal.foods.reduce((sum, food) => sum + food.calories, 0)

            return (
              <div
                key={meal.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                  isLogged
                    ? 'bg-success/10 border-success/25'
                    : 'bg-surface-700 border-surface-600'
                }`}
              >
                {isLogged
                  ? <CheckCircleSolid className="w-4 h-4 text-success shrink-0" />
                  : <CheckCircleIcon className="w-4 h-4 text-slate-600 shrink-0" />
                }
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${isLogged ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                    {meal.name}
                  </p>
                  <p className={`text-[10px] truncate ${isLogged ? 'text-success/75' : 'text-slate-600'}`}>
                    {isLogged ? `Logged · ${Math.round(calories)} kcal` : 'Not logged'}
                  </p>
                </div>
                {!isLogged && (
                  <button
                    onClick={() => navigate('/nutrition')}
                    className="text-[10px] font-semibold text-accent"
                  >
                    Log
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Meal reminder banners */}
      {dueReminders.map((r) => (
        <div key={r.mealId} className="flex items-center gap-3 bg-surface-800 rounded-2xl px-4 py-3 border border-accent/20">
          <BellIcon className="w-4 h-4 text-accent shrink-0" />
          <p className="text-sm text-slate-300 flex-1">Time to log <span className="font-semibold text-slate-100">{r.label}</span></p>
          <button onClick={() => navigate('/nutrition')} className="text-xs font-semibold text-accent">
            Log →
          </button>
        </div>
      ))}

      {/* Today's Workout */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <BoltIcon className="w-3.5 h-3.5 text-accent" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">Today's Workout</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-100">
              {todayWorkout.isRest ? '😴 Rest Day' : todayWorkout.label}
            </p>
            {!todayWorkout.isRest && todayWorkout.focusLabel && (
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
              {todayLog.exercises.reduce((s, e) => s + e.sets.length, 0)} sets completed
            </p>
          </div>
        )}
      </div>

      {/* Supplement timing */}
      <SupplementCard date={today} />

      {/* Oura Recovery */}
      {settingsLoading ? (
        <div className="bg-surface-800 rounded-2xl px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-surface-700 animate-pulse" />
            <div className="h-3 w-20 bg-surface-700 rounded animate-pulse" />
          </div>
          <div className="h-16 bg-surface-700 rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-24 bg-surface-700 rounded-xl animate-pulse" />
            <div className="h-24 bg-surface-700 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : settings.ouraToken ? (
        <OuraCard token={settings.ouraToken} />
      ) : (
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 bg-surface-800 rounded-2xl px-4 py-4 text-left border border-dashed border-surface-600 hover:border-accent/50 transition-colors"
        >
          <HeartIcon className="w-5 h-5 text-danger shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-300">Connect Oura Ring</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Get recovery scores, HRV, sleep quality, and daily training recommendations
            </p>
          </div>
        </button>
      )}

    </div>
  )
}

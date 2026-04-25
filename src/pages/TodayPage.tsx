import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhaseChip } from '../components/workout/PhaseChip'
import { StatCard } from '../components/metrics/StatCard'
import { Button } from '../components/shared/Button'
import { AgendaBlock } from '../components/today/AgendaBlock'
import { CalendarWidget } from '../components/calendar/CalendarWidget'
import { useCurrentWeek } from '../hooks/useCurrentWeek'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import { useSettings } from '../hooks/useSettings'
import { useDailyAgenda } from '../hooks/useDailyAgenda'
import { useDailySummary } from '../hooks/useDailySummary'
import { getWorkoutForDay } from '../data/program'
import { DEFAULT_USER_PROFILE, NUTRITION_TARGETS } from '../data/userProfile'
import { MORNING_SUPPLEMENTS, POST_WORKOUT_SUPPLEMENTS, EVENING_SUPPLEMENTS } from '../data/supplements'
import { SLOT_TO_MEAL_ID } from '../data/mealLibrary'
import type { MealPreset } from '../data/mealLibrary'
import { ScaleIcon, FireIcon, CalendarIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { FoodItem } from '../types'

function getDayOfWeek(): import('../types').DayOfWeek {
  const days: import('../types').DayOfWeek[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  ]
  return days[new Date().getDay()]
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr + 'T00:00:00').getTime() - new Date().getTime()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function currentBlock(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

interface TodayPageProps {
  onOpenSettings?: () => void
}

export default function TodayPage({ onOpenSettings }: TodayPageProps) {
  const navigate = useNavigate()
  const startDate = localStorage.getItem('program_start_date') ?? new Date().toISOString().split('T')[0]
  const { week, phase } = useCurrentWeek(startDate)
  const { getTodayLog, getCompletedDates } = useWorkoutLog()
  const { getDayTotals, addFood } = useNutritionLog()
  const { latestWeight, metrics, addWeightEntry } = useBodyMetrics()
  const { settings } = useSettings()
  const { isChecked, toggleItem, checkAll, isCheatDay, toggleCheatDay } = useDailyAgenda()
  const [weightInput, setWeightInput] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const todayLog = getTodayLog()
  const todayWorkout = getWorkoutForDay(getDayOfWeek())
  const totals = getDayTotals(today)
  const completedDates = getCompletedDates()

  const streak = (() => {
    let s = 0
    const d = new Date()
    while (true) {
      const key = d.toISOString().split('T')[0]
      if (completedDates.includes(key)) { s++; d.setDate(d.getDate() - 1) }
      else break
    }
    return s
  })()

  // Weekly weight prompt — show if last entry is >= 7 days ago
  const lastWeightDate = metrics.weightLog.at(-1)?.date
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

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const daysToGoal = daysUntil(DEFAULT_USER_PROFILE.goalDate)
  const lbsToGoal = Math.max(0, latestWeight - DEFAULT_USER_PROFILE.goalWeightLbs)
  const block = currentBlock()

  const { summary } = useDailySummary(settings.anthropicApiKey, {
    dayName,
    workoutLabel: todayWorkout.isRest ? 'Rest Day' : todayWorkout.label,
    week,
    phase,
    weightLbs: latestWeight,
    daysToGoal,
  })

  const staticSummary = todayWorkout.isRest
    ? `Rest day · Week ${week} ${phase} phase · ${lbsToGoal > 0 ? `${lbsToGoal} lbs to goal` : 'Goal reached'}`
    : `${todayWorkout.label} · Week ${week} ${phase} phase · ${lbsToGoal > 0 ? `${lbsToGoal} lbs to goal` : 'Goal reached'}`

  const handleLogMeal = (slot: { id: string; label: string }, preset: MealPreset) => {
    const mealId = SLOT_TO_MEAL_ID[slot.id] ?? 'snacks'
    const food: FoodItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: preset.name,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
    }
    addFood(today, mealId, food)
  }

  // Compact macro bar
  const calPct = Math.min(100, (totals.calories / NUTRITION_TARGETS.calories) * 100)
  const proteinPct = Math.min(100, (totals.protein / NUTRITION_TARGETS.protein) * 100)

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm">{dayName}, {dateStr}</p>
          <h1 className="text-2xl font-bold text-gradient mt-0.5">{getGreeting()}, Luke</h1>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-surface-800 border border-surface-700 text-slate-400 hover:text-slate-200 mt-1"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Phase + streak */}
      <div className="flex items-center gap-3 flex-wrap">
        <PhaseChip phase={phase} week={week} />
        {streak > 0 && <span className="text-xs font-semibold text-warn animate-streak-fire inline-block">🔥 {streak}-day streak</span>}
      </div>

      {/* Daily summary */}
      <div className={`rounded-2xl border px-4 py-3 ${isCheatDay ? 'bg-warn/10 border-warn/30' : 'bg-surface-800 border-surface-700'}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-slate-300 leading-relaxed flex-1">
            {summary ?? staticSummary}
          </p>
          <button
            onClick={toggleCheatDay}
            className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
              isCheatDay
                ? 'bg-warn text-surface-900'
                : 'bg-surface-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isCheatDay ? '🎉 Cheat Day' : 'Cheat Day?'}
          </button>
        </div>
        {isCheatDay && (
          <p className="text-xs text-warn/70 mt-1">Supplements still apply. Enjoy it — back on track tomorrow.</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Weight"
          value={latestWeight}
          unit="lbs"
          icon={<ScaleIcon className="w-4 h-4" />}
        />
        <StatCard
          label="To Goal"
          value={lbsToGoal > 0 ? `-${lbsToGoal}` : '✓'}
          unit={lbsToGoal > 0 ? 'lbs' : undefined}
          color={lbsToGoal === 0 ? 'text-success' : 'text-slate-100'}
          icon={<FireIcon className="w-4 h-4" />}
        />
        <StatCard
          label="Days Left"
          value={daysToGoal}
          subtext="to July 2026"
          icon={<CalendarIcon className="w-4 h-4" />}
        />
      </div>

      {/* Weekly weight check-in prompt */}
      {showWeightPrompt && (
        <div className="bg-surface-800 rounded-2xl border border-accent/30 px-4 py-3 space-y-2 card-highlight animate-fade-up">
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
            {daysSinceWeight >= 999 ? 'No weight logged yet.' : `Last logged ${daysSinceWeight} days ago.`} Weigh in first thing in the morning for consistency.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              min="100"
              max="400"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWeightLog()}
              placeholder={latestWeight ? String(latestWeight) : '193.0'}
              className="flex-1 bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent"
            />
            <span className="flex items-center text-xs text-slate-500 pr-1">lbs</span>
            <button
              onClick={handleWeightLog}
              disabled={!weightInput}
              className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-accent-light transition-colors"
            >
              Log
            </button>
          </div>
        </div>
      )}

      {/* Compact macro progress */}
      {!isCheatDay && (
        <div className="bg-surface-800 rounded-2xl border border-surface-700 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today's Nutrition</p>
            <button onClick={() => navigate('/nutrition')} className="text-xs text-accent font-semibold">
              Details →
            </button>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-14">Calories</span>
              <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${calPct}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 w-16 text-right">{totals.calories} / {NUTRITION_TARGETS.calories}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-14">Protein</span>
              <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${proteinPct}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 w-16 text-right">{totals.protein}g / {NUTRITION_TARGETS.protein}g</span>
            </div>
          </div>
        </div>
      )}

      {/* Morning Block */}
      <AgendaBlock
        label="Morning"
        timeRange="Rise – 12 PM"
        defaultExpanded={block === 'morning'}
        supplements={MORNING_SUPPLEMENTS}
        mealSlots={[{ id: 'breakfast', label: 'Breakfast', category: 'breakfast' }]}
        isChecked={isChecked}
        onToggle={toggleItem}
        onCheckAll={checkAll}
        onLogMeal={handleLogMeal}
        onCustomMeal={() => navigate('/nutrition')}
      >
        {/* Workout card inside morning block */}
        <div className="mt-1 bg-surface-700/60 rounded-xl border border-surface-600 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Today's Workout</p>
              {todayWorkout.isRest ? (
                <p className="text-sm font-bold text-slate-300 mt-0.5">Rest Day 😴</p>
              ) : (
                <p className="text-sm font-bold text-slate-100 mt-0.5">{todayWorkout.label}</p>
              )}
            </div>
            {!todayWorkout.isRest && (
              todayLog?.completedAt ? (
                <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">✓ Done</span>
              ) : (
                <Button size="sm" onClick={() => navigate('/workout')}>
                  {todayLog ? 'Continue' : 'Start'}
                </Button>
              )
            )}
          </div>
        </div>
      </AgendaBlock>

      {/* Afternoon Block */}
      <AgendaBlock
        label="Afternoon"
        timeRange="12 PM – 6 PM"
        defaultExpanded={block === 'afternoon'}
        supplements={todayWorkout.isRest ? [] : POST_WORKOUT_SUPPLEMENTS}
        mealSlots={[
          { id: 'lunch', label: 'Lunch', category: 'lunch' },
          { id: 'snack', label: 'Snack', category: 'snack', optional: true },
        ]}
        isChecked={isChecked}
        onToggle={toggleItem}
        onCheckAll={checkAll}
        onLogMeal={handleLogMeal}
        onCustomMeal={() => navigate('/nutrition')}
      />

      {/* Evening Block */}
      <AgendaBlock
        label="Evening"
        timeRange="6 PM – Sleep"
        defaultExpanded={block === 'evening'}
        supplements={EVENING_SUPPLEMENTS}
        mealSlots={[
          { id: 'dinner', label: 'Dinner', category: 'dinner' },
          { id: 'dessert', label: 'Dessert', category: 'dessert', optional: true },
        ]}
        isChecked={isChecked}
        onToggle={toggleItem}
        onCheckAll={checkAll}
        onLogMeal={handleLogMeal}
        onCustomMeal={() => navigate('/nutrition')}
      />

      {/* Google Calendar */}
      {settings.googleClientId && (
        <CalendarWidget
          clientId={settings.googleClientId}
          todayWorkout={todayWorkout.isRest ? null : todayWorkout}
          currentWeek={week}
        />
      )}

    </div>
  )
}

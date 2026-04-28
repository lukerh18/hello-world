import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentWeek } from '../hooks/useCurrentWeek'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import { useSettings } from '../hooks/useSettings'
import { useHabits } from '../hooks/useHabits'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
import { useDailyAgenda } from '../hooks/useDailyAgenda'
import { getWorkoutForDay } from '../data/program'
import { DEFAULT_USER_PROFILE, NUTRITION_TARGETS } from '../data/userProfile'
import { AgendaBlock } from '../components/today/AgendaBlock'
import { DayPlan } from '../components/today/DayPlan'
import { Button } from '../components/shared/Button'
import {
  MORNING_SUPPLEMENTS, PRE_WORKOUT_SUPPLEMENTS, POST_WORKOUT_SUPPLEMENTS,
  AFTERNOON_SUPPLEMENTS, EVENING_SUPPLEMENTS,
} from '../data/supplements'
import { SLOT_TO_MEAL_ID } from '../data/mealLibrary'
import type { MealPreset } from '../data/mealLibrary'
import {
  Cog6ToothIcon, ScaleIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon,
  CalendarDaysIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline'
import type { FoodItem, DayOfWeek } from '../types'

function getDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  return days[new Date().getDay()]
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 86400000))
}

function currentTimeBlock(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

interface TodayPageProps { onOpenSettings?: () => void }

export default function TodayPage({ onOpenSettings }: TodayPageProps) {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const startDate = settings.programStartDate || new Date().toISOString().split('T')[0]
  const { week, phase } = useCurrentWeek(startDate)
  const { getTodayLog, getCompletedDates } = useWorkoutLog()
  const { getDayTotals, addFood, getByDate } = useNutritionLog()
  const { latestWeight, metrics, addWeightEntry } = useBodyMetrics()
  const { isChecked, toggleItem, checkAll } = useDailyAgenda()
  const {
    todayHabits, isHabitDone, toggleHabit,
    majorTask, setMajorTask, streak,
  } = useHabits()
  const gcal = useGoogleCalendar(settings.googleClientId ?? '')

  const [weightInput, setWeightInput] = useState('')
  const [supplementsOpen, setSupplementsOpen] = useState(false)
  // calendar event checked state lives in useDailyAgenda (checked_ids)
  const [checkedEventIds, setCheckedEventIds] = useState<string[]>([])

  const today = new Date().toISOString().split('T')[0]
  const todayLog = getTodayLog()
  const todayWorkout = getWorkoutForDay(getDayOfWeek())
  const totals = getDayTotals(today)
  const completedDates = getCompletedDates()
  const dayData = getByDate(today)
  const block = currentTimeBlock()

  const getLoggedName = (slotId: string): string | undefined => {
    const mealId = SLOT_TO_MEAL_ID[slotId] ?? slotId
    const meal = dayData.meals.find((m) => m.id === mealId)
    const count = meal?.foods.length ?? 0
    if (count === 0) return undefined
    const first = meal!.foods[0].name
    return count > 1 ? `${first} +${count - 1} more` : first
  }

  const workoutStreak = (() => {
    let s = 0
    const d = new Date()
    while (true) {
      const key = d.toISOString().split('T')[0]
      if (completedDates.includes(key)) { s++; d.setDate(d.getDate() - 1) } else break
    }
    return s
  })()

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

  const handleLogMeal = (slot: { id: string }, preset: MealPreset) => {
    const mealId = SLOT_TO_MEAL_ID[slot.id] ?? 'snacks'
    const food: FoodItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: preset.name, calories: preset.calories,
      protein: preset.protein, carbs: preset.carbs, fat: preset.fat,
    }
    addFood(today, mealId, food)
  }

  const toggleEventCheck = (id: string) => {
    setCheckedEventIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const daysToGoal = daysUntil(DEFAULT_USER_PROFILE.goalDate)
  const lbsToGoal = Math.max(0, latestWeight - DEFAULT_USER_PROFILE.goalWeightLbs)

  const calPct = Math.min(100, (totals.calories / NUTRITION_TARGETS.calories) * 100)
  const proteinPct = Math.min(100, (totals.protein / NUTRITION_TARGETS.protein) * 100)

  // Free window insight from calendar intelligence
  const freeSlots = gcal.isConnected ? gcal.getFreeSlots() : []
  const freeSlotLabel = freeSlots[0]?.label

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <p className="text-slate-500 text-sm">{dayName}, {dateStr}</p>
          <h1 className="text-2xl font-bold text-gradient mt-0.5">{getGreeting()}, Luke</h1>
          <p className="text-xs text-slate-600 mt-1">
            <span className="text-slate-400">{latestWeight} lbs</span>
            {lbsToGoal > 0
              ? <> · <span className="text-slate-400">{lbsToGoal} lbs</span> to goal · <span className="text-slate-400">{daysToGoal}d</span> left</>
              : <span className="text-success"> · Goal reached 🎉</span>}
          </p>
        </div>
        {onOpenSettings && (
          <button onClick={onOpenSettings} className="p-2 rounded-xl bg-surface-800 text-slate-600 hover:text-slate-300 mt-1 transition-colors">
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-slate-600 -mt-2">
        Week {week} · {phase.label} phase
        {workoutStreak > 0 && <span className="text-warn animate-streak-fire inline-block ml-2">🔥 {workoutStreak}-day streak</span>}
        {streak > 0 && <span className="text-success ml-2">✦ {streak}-day habit streak</span>}
      </p>

      {/* Weight check-in */}
      {showWeightPrompt && (
        <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScaleIcon className="w-4 h-4 text-accent" />
              <p className="text-sm font-semibold text-slate-200">Weekly weigh-in</p>
            </div>
            <button onClick={() => localStorage.setItem('weight_prompt_snoozed', today)} className="text-slate-600 hover:text-slate-400">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {daysSinceWeight >= 999 ? 'No weight logged yet.' : `Last logged ${daysSinceWeight} days ago.`}
          </p>
          <div className="flex gap-2">
            <input type="number" step="0.1" min="100" max="400" value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWeightLog()}
              placeholder={latestWeight ? String(latestWeight) : '193.0'}
              className="flex-1 bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent" />
            <span className="flex items-center text-xs text-slate-500">lbs</span>
            <button onClick={handleWeightLog} disabled={!weightInput}
              className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-40">Log</button>
          </div>
        </div>
      )}

      {/* Google Calendar */}
      {!gcal.isConnected ? (
        <button
          onClick={gcal.connect}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-surface-600 text-slate-500 hover:text-slate-300 hover:border-accent/40 transition-colors"
        >
          <CalendarDaysIcon className="w-4 h-4" />
          <span className="text-sm">Connect Google Calendar</span>
        </button>
      ) : (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] text-accent font-medium uppercase tracking-wide">Calendar synced</span>
            {gcal.loading && <span className="text-[10px] text-slate-600">loading…</span>}
            {gcal.error && <span className="text-[10px] text-danger">{gcal.error}</span>}
          </div>
          <button onClick={() => gcal.refresh()} className="text-slate-700 hover:text-slate-400">
            <ArrowPathIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Day Plan — calendar events + habits in time blocks */}
      <DayPlan
        habits={todayHabits}
        isHabitDone={isHabitDone}
        toggleHabit={toggleHabit}
        majorTask={majorTask}
        setMajorTask={setMajorTask}
        calendarEvents={gcal.events}
        checkedEventIds={checkedEventIds}
        onToggleEvent={toggleEventCheck}
        freeSlotLabel={freeSlotLabel}
      />

      {/* Body stats strip */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Workout</p>
            <p className="text-sm font-semibold text-slate-200 mt-0.5">
              {todayWorkout.isRest ? '😴 Rest day' : todayWorkout.label}
            </p>
          </div>
          {!todayWorkout.isRest && (
            todayLog?.completedAt
              ? <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">✓ Done</span>
              : <Button size="sm" onClick={() => navigate('/workout')}>{todayLog ? 'Continue' : 'Start'}</Button>
          )}
        </div>

        <div className="space-y-1.5 border-t border-surface-700 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Nutrition</p>
            <button onClick={() => navigate('/nutrition')} className="text-xs text-accent font-semibold">Log →</button>
          </div>
          {[
            { label: 'Calories', pct: calPct,     val: `${totals.calories} / ${NUTRITION_TARGETS.calories}`,         color: 'bg-accent' },
            { label: 'Protein',  pct: proteinPct, val: `${totals.protein}g / ${NUTRITION_TARGETS.protein}g`, color: 'bg-blue-400' },
          ].map(({ label, pct, val, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600 w-14">{label}</span>
              <div className="flex-1 h-1 bg-surface-700 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 w-24 text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Protocol (supplements) */}
      <div className="bg-surface-800 rounded-2xl overflow-hidden">
        <button onClick={() => setSupplementsOpen((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3 text-left">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Daily Protocol</p>
          {supplementsOpen ? <ChevronUpIcon className="w-4 h-4 text-slate-600" /> : <ChevronDownIcon className="w-4 h-4 text-slate-600" />}
        </button>
        {supplementsOpen && (
          <div className="px-4 pb-3 space-y-3">
            <AgendaBlock label="Morning" timeRange="Rise – 12 PM" defaultExpanded={block === 'morning'}
              supplements={[...MORNING_SUPPLEMENTS, ...(todayWorkout.isRest ? [] : PRE_WORKOUT_SUPPLEMENTS)]}
              mealSlots={[{ id: 'breakfast', label: 'Breakfast', category: 'breakfast', loggedName: getLoggedName('breakfast') }]}
              isChecked={isChecked} onToggle={toggleItem} onCheckAll={checkAll}
              onLogMeal={handleLogMeal} onCustomMeal={() => navigate('/nutrition')} />
            <AgendaBlock label="Afternoon" timeRange="12 PM – 6 PM" defaultExpanded={block === 'afternoon'}
              supplements={[...(todayWorkout.isRest ? [] : POST_WORKOUT_SUPPLEMENTS), ...AFTERNOON_SUPPLEMENTS]}
              mealSlots={[{ id: 'lunch', label: 'Lunch', category: 'lunch', loggedName: getLoggedName('lunch') }, { id: 'snack', label: 'Snack', category: 'snack', optional: true, loggedName: getLoggedName('snack') }]}
              isChecked={isChecked} onToggle={toggleItem} onCheckAll={checkAll}
              onLogMeal={handleLogMeal} onCustomMeal={() => navigate('/nutrition')} />
            <AgendaBlock label="Evening" timeRange="6 PM – Sleep" defaultExpanded={block === 'evening'}
              supplements={EVENING_SUPPLEMENTS}
              mealSlots={[{ id: 'dinner', label: 'Dinner', category: 'dinner', loggedName: getLoggedName('dinner') }, { id: 'dessert', label: 'Dessert', category: 'dessert', optional: true, loggedName: getLoggedName('dessert') }]}
              isChecked={isChecked} onToggle={toggleItem} onCheckAll={checkAll}
              onLogMeal={handleLogMeal} onCustomMeal={() => navigate('/nutrition')} />
          </div>
        )}
      </div>

    </div>
  )
}

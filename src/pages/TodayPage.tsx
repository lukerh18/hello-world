import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentWeek } from '../hooks/useCurrentWeek'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import { useSettings } from '../hooks/useSettings'
import { useHabits } from '../hooks/useHabits'
import { useJournal } from '../hooks/useJournal'
import { useReadingLog } from '../hooks/useReadingLog'
import { useDailySummary } from '../hooks/useDailySummary'
import { getWorkoutForDay } from '../data/program'
import { DEFAULT_USER_PROFILE, NUTRITION_TARGETS } from '../data/userProfile'
import { OuraCard } from '../components/today/OuraCard'
import { AgendaBlock } from '../components/today/AgendaBlock'
import { Button } from '../components/shared/Button'
import {
  MORNING_SUPPLEMENTS, PRE_WORKOUT_SUPPLEMENTS, POST_WORKOUT_SUPPLEMENTS,
  AFTERNOON_SUPPLEMENTS, EVENING_SUPPLEMENTS,
} from '../data/supplements'
import { SLOT_TO_MEAL_ID } from '../data/mealLibrary'
import type { MealPreset } from '../data/mealLibrary'
import { useDailyAgenda } from '../hooks/useDailyAgenda'
import { celebrateSingle } from '../utils/celebrate'
import {
  Cog6ToothIcon, ScaleIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon,
  SparklesIcon, CheckCircleIcon as CheckOutline,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import type { FoodItem } from '../types'

function getDayOfWeek(): import('../types').DayOfWeek {
  const days: import('../types').DayOfWeek[] = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
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

function currentBlock(): 'morning' | 'afternoon' | 'evening' {
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
    majorTask, setMajorTask, streak, doneCount, totalCount,
  } = useHabits()
  const { todayContent } = useJournal()
  const { todayEntry: readingToday, recentBook, totalPagesCurrentBook } = useReadingLog()
  const [weightInput, setWeightInput] = useState('')
  const [supplementsOpen, setSupplementsOpen] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const todayLog = getTodayLog()
  const todayWorkout = getWorkoutForDay(getDayOfWeek())
  const totals = getDayTotals(today)
  const completedDates = getCompletedDates()
  const dayData = getByDate(today)
  const block = currentBlock()

  const getLoggedName = (slotId: string): string | undefined => {
    const mealId = SLOT_TO_MEAL_ID[slotId] ?? slotId
    const meal = dayData.meals.find((m) => m.id === mealId)
    const count = meal?.foods.length ?? 0
    if (count === 0) return undefined
    const first = meal!.foods[0].name
    return count > 1 ? `${first} +${count - 1} more` : first
  }

  const streak_ = (() => {
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
    const food: FoodItem = { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, name: preset.name, calories: preset.calories, protein: preset.protein, carbs: preset.carbs, fat: preset.fat }
    addFood(today, mealId, food)
  }

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const daysToGoal = daysUntil(DEFAULT_USER_PROFILE.goalDate)
  const lbsToGoal = Math.max(0, latestWeight - DEFAULT_USER_PROFILE.goalWeightLbs)

  const { summary } = useDailySummary({
    dayName,
    workoutLabel: todayWorkout.isRest ? 'Rest Day' : todayWorkout.label,
    week, phase: phase.label, weightLbs: latestWeight, daysToGoal,
  })

  const staticSummary = todayWorkout.isRest
    ? `Rest day · Week ${week} ${phase.label} phase · ${lbsToGoal > 0 ? `${lbsToGoal} lbs to goal` : 'Goal reached'}`
    : `${todayWorkout.label} · Week ${week} ${phase.label} phase · ${lbsToGoal > 0 ? `${lbsToGoal} lbs to goal` : 'Goal reached'}`

  const calPct = Math.min(100, (totals.calories / NUTRITION_TARGETS.calories) * 100)
  const proteinPct = Math.min(100, (totals.protein / NUTRITION_TARGETS.protein) * 100)

  // Categorised habit lists for Today display
  const spiritHabits = todayHabits.filter((h) => h.category === 'spirit')
  const mindHabits   = todayHabits.filter((h) => h.category === 'soul_mind')
  const emoHabits    = todayHabits.filter((h) => h.category === 'soul_emotions')
  const willHabits   = todayHabits.filter((h) => h.category === 'soul_will')

  const MiniCheck = ({ id, label, icon }: { id: string; label: string; icon: string }) => {
    const done = isHabitDone(id)
    return (
      <button onClick={() => { toggleHabit(id); if (!done) celebrateSingle() }}
        className="flex items-center gap-2 py-1 w-full text-left group">
        {done
          ? <CheckSolid className="w-4 h-4 text-success flex-shrink-0" />
          : <CheckOutline className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
        }
        <span className="text-sm flex-shrink-0">{icon}</span>
        <span className={`text-sm transition-colors ${done ? 'line-through text-slate-500' : 'text-slate-300'}`}>{label}</span>
      </button>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm">{dayName}, {dateStr}</p>
          <h1 className="text-2xl font-bold text-gradient mt-0.5">{getGreeting()}, Luke</h1>
          <p className="text-xs text-slate-600 mt-1.5">
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
        {streak_ > 0 && <span className="text-warn animate-streak-fire inline-block ml-2">🔥 {streak_}-day streak</span>}
      </p>

      {/* AI summary */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3">
        <p className="text-sm text-slate-300 leading-relaxed">{summary ?? staticSummary}</p>
      </div>

      {/* Weight check-in */}
      {showWeightPrompt && (
        <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2 card-highlight">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScaleIcon className="w-4 h-4 text-accent" />
              <p className="text-sm font-semibold text-slate-200">Weekly weigh-in</p>
            </div>
            <button onClick={() => localStorage.setItem('weight_prompt_snoozed', today)} className="text-slate-600 hover:text-slate-400">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500">{daysSinceWeight >= 999 ? 'No weight logged yet.' : `Last logged ${daysSinceWeight} days ago.`} Weigh in first thing in the morning.</p>
          <div className="flex gap-2">
            <input type="number" step="0.1" min="100" max="400" value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWeightLog()}
              placeholder={latestWeight ? String(latestWeight) : '193.0'}
              className="flex-1 bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent" />
            <span className="flex items-center text-xs text-slate-500 pr-1">lbs</span>
            <button onClick={handleWeightLog} disabled={!weightInput}
              className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-40">Log</button>
          </div>
        </div>
      )}

      {/* ── SPIRIT ── */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-300" />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-indigo-300">Spirit</p>
          </div>
          <button onClick={() => navigate('/life')} className="text-[10px] text-accent">Life →</button>
        </div>
        {spiritHabits.map((h) => <MiniCheck key={h.id} id={h.id} label={h.name} icon={h.icon} />)}
        {todayContent && (
          <p className="text-xs text-slate-600 italic pt-1 truncate">📝 {todayContent.slice(0, 60)}{todayContent.length > 60 ? '…' : ''}</p>
        )}
      </div>

      {/* ── SOUL ── */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Soul</p>
          <button onClick={() => navigate('/life')} className="text-[10px] text-accent">Life →</button>
        </div>
        {[...mindHabits, ...emoHabits, ...willHabits].map((h) => (
          <MiniCheck key={h.id} id={h.id} label={h.name} icon={h.icon} />
        ))}
        {recentBook && (
          <p className="text-xs text-slate-600 pl-6 pt-0.5">
            📚 {recentBook}{readingToday ? ` · ${readingToday.pagesRead}p today` : ''}
          </p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-sm">🎯</span>
          <input type="text" value={majorTask} onChange={(e) => setMajorTask(e.target.value)}
            placeholder="Today's major task…"
            className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 focus:outline-none" />
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Body</p>

        {/* Workout */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Workout</p>
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

        {/* Nutrition */}
        <div className="space-y-1.5 border-t border-surface-700 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Nutrition</p>
            <button onClick={() => navigate('/nutrition')} className="text-xs text-accent font-semibold">Log →</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 w-14">Calories</span>
            <div className="flex-1 h-1 bg-surface-700 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${calPct}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 w-20 text-right">{totals.calories} / {NUTRITION_TARGETS.calories}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 w-14">Protein</span>
            <div className="flex-1 h-1 bg-surface-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${proteinPct}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 w-20 text-right">{totals.protein}g / {NUTRITION_TARGETS.protein}g</span>
          </div>
        </div>

        {/* Oura */}
        {settings.ouraToken && (
          <div className="border-t border-surface-700 pt-3">
            <OuraCard token={settings.ouraToken} />
          </div>
        )}
      </div>

      {/* Supplements (collapsible) */}
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

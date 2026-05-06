import { useCallback, useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { MealCard } from '../components/nutrition/MealCard'
import { AddFoodModal } from '../components/nutrition/AddFoodModal'
import { NutritionSummary } from '../components/nutrition/NutritionSummary'
import { MealSuggestions } from '../components/nutrition/MealSuggestions'
import { PhotoAnalyzer } from '../components/nutrition/PhotoAnalyzer'
import { Button } from '../components/shared/Button'
import { CelebrationBanner, type CelebrationMessage } from '../components/shared/CelebrationBanner'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { useMealReminders } from '../hooks/useMealReminders'
import { NUTRITION_TARGETS } from '../data/userProfile'
import { getMealsForDay } from '../data/mealPlan'
import type { SuggestedMeal } from '../data/mealPlan'
import { BellIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import type { DailyNutrition, FoodItem } from '../types'
import { celebrateBlock, celebrateSingle } from '../utils/celebrate'

type MealId = 'breakfast' | 'lunch' | 'snacks' | 'dinner'
type SuggestedMealId = SuggestedMeal['id']

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yStr = yesterday.toISOString().split('T')[0]
  if (dateStr === todayStr) return 'Today'
  if (dateStr === yStr) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDayOfWeek(dateStr: string): import('../types').DayOfWeek {
  const days: import('../types').DayOfWeek[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  ]
  return days[new Date(dateStr + 'T12:00:00').getDay()]
}

type Tab = 'logged' | 'suggested'

function createFoodId(): string {
  return crypto.randomUUID()
}

function normalizeSuggestedMealId(mealId: string): MealId {
  return mealId === 'snack' ? 'snacks' : mealId as MealId
}

function getCurrentSuggestedMealId(now = new Date()): SuggestedMealId {
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (minutes < 10 * 60 + 30) return 'breakfast'
  if (minutes < 14 * 60 + 30) return 'lunch'
  if (minutes < 17 * 60 + 30) return 'snack'
  return 'dinner'
}

function hasMealFood(dayData: DailyNutrition, mealId: SuggestedMealId): boolean {
  const logMealId = normalizeSuggestedMealId(mealId)
  return dayData.meals.some((meal) => meal.id === logMealId && meal.foods.length > 0)
}

function getSmartSuggestedMealId(dayData: DailyNutrition, date: string, today: string): SuggestedMealId {
  const order: SuggestedMealId[] = ['breakfast', 'lunch', 'snack', 'dinner']
  const currentMealId = date === today ? getCurrentSuggestedMealId() : 'breakfast'
  const currentIndex = order.indexOf(currentMealId)
  const remainingToday = order.slice(currentIndex).find((mealId) => !hasMealFood(dayData, mealId))
  const firstOpenMeal = order.find((mealId) => !hasMealFood(dayData, mealId))
  return remainingToday ?? firstOpenMeal ?? currentMealId
}

function prioritizeSuggestedMeals(meals: SuggestedMeal[], recommendedMealId: SuggestedMealId): SuggestedMeal[] {
  const recommended = meals.find((meal) => meal.id === recommendedMealId)
  if (!recommended) return meals
  return [recommended, ...meals.filter((meal) => meal.id !== recommendedMealId)]
}

export default function NutritionPage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [addFoodOpen, setAddFoodOpen] = useState(false)
  const [activeMealId, setActiveMealId] = useState<string>('breakfast')
  const [tab, setTab] = useState<Tab>('logged')
  const [loggedMealIds, setLoggedMealIds] = useState<Set<string>>(new Set())
  const [celebration, setCelebration] = useState<CelebrationMessage | null>(null)

  const { getByDate, addFood, addFoods, deleteFood, getDayTotals } = useNutritionLog()
  const { reminders, permission, toggle, setTime, requestPermission } = useMealReminders()
  const [showReminders, setShowReminders] = useState(false)

  const dayData = getByDate(date)
  const totals = getDayTotals(date)
  const suggestedMeals = getMealsForDay(getDayOfWeek(date))
  const recommendedMealId = useMemo(() => getSmartSuggestedMealId(dayData, date, today), [dayData, date, today])
  const prioritizedSuggestedMeals = useMemo(
    () => prioritizeSuggestedMeals(suggestedMeals, recommendedMealId),
    [suggestedMeals, recommendedMealId]
  )

  const nextMeal = useMemo(() => {
    return dayData.meals.find((meal) => meal.id === normalizeSuggestedMealId(recommendedMealId)) ?? dayData.meals[0]
  }, [dayData.meals, recommendedMealId])

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const next = d.toISOString().split('T')[0]
    if (next <= today) setDate(next)
  }

  const showCelebration = useCallback((message: Omit<CelebrationMessage, 'id'>) => {
    setCelebration({ ...message, id: Date.now() })
  }, [])

  const clearCelebration = useCallback(() => setCelebration(null), [])

  const celebrateFoodLog = useCallback((mealName: string, detail?: string) => {
    celebrateSingle()
    showCelebration({
      tone: 'warm',
      title: `${mealName} logged. Nice care for your Body.`,
      detail: detail ?? 'Quick logging done. That is the rhythm working for you.',
    })
  }, [showCelebration])

  const handleAddFood = (mealId: string, food: FoodItem) => {
    addFood(date, mealId, food)
    const mealName = dayData.meals.find((meal) => meal.id === mealId)?.name ?? 'Food'
    celebrateFoodLog(mealName, `${food.name} is in your log. Good job following through.`)
  }

  const openAddFood = (mealId: string) => {
    setActiveMealId(mealId)
    setAddFoodOpen(true)
  }

  const handleLogSuggestedMeal = (meal: SuggestedMeal) => {
    const foods: FoodItem[] = meal.items.map((item) => ({
      id: createFoodId(),
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }))
    addFoods(date, meal.id, foods)
    setLoggedMealIds((prev) => new Set([...prev, meal.id + '_suggested']))
    celebrateBlock()
    showCelebration({
      tone: 'success',
      title: `${meal.name} logged. You made the healthy choice easy.`,
      detail: 'That meal supports the plan and keeps today moving.',
    })
  }

  const handlePhotoFood = (food: Omit<FoodItem, 'id'>, mealId: MealId) => {
    const fullFood: FoodItem = {
      id: createFoodId(),
      ...food,
    }
    addFood(date, mealId, fullFood)
    const mealName = dayData.meals.find((meal) => meal.id === mealId)?.name ?? 'Meal'
    celebrateFoodLog(mealName, `${food.name} came in from your photo. Logged and done.`)
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <PageHeader title="Nutrition" />
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="p-1.5 rounded-lg bg-surface-700 text-slate-400">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-200 min-w-[70px] text-center">
            {formatDateDisplay(date)}
          </span>
          <button
            onClick={() => changeDate(1)}
            disabled={date >= today}
            className="p-1.5 rounded-lg bg-surface-700 text-slate-400 disabled:opacity-30"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-surface-800 rounded-2xl border border-surface-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Today Targets</p>
            <p className="text-sm font-semibold text-slate-100">Next meal: {nextMeal?.name ?? 'Meal'}</p>
          </div>
        </div>
        <NutritionSummary totals={totals} targets={NUTRITION_TARGETS} title="Daily Nutrition" embedded />
      </div>

      <CelebrationBanner message={celebration} onDone={clearCelebration} />

      {/* Meal Reminders */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden">
        <button
          onClick={() => setShowReminders((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-slate-200">Meal Reminders</span>
          </div>
          <span className="text-xs text-slate-500">{showReminders ? 'Hide' : 'Set times'}</span>
        </button>

        {showReminders && (
          <div className="px-4 pb-4 space-y-3 border-t border-surface-700 pt-3">
            {permission === 'prompt' && (
              <button
                onClick={requestPermission}
                className="w-full text-xs text-center text-accent font-semibold py-2 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors"
              >
                Enable notifications to get alerts when the app is open
              </button>
            )}
            {reminders.map((r) => (
              <div key={r.mealId} className="flex items-center gap-3">
                <button
                  onClick={() => toggle(r.mealId)}
                  className={`w-9 h-5 rounded-full transition-colors shrink-0 ${r.enabled ? 'bg-accent' : 'bg-surface-600'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${r.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm text-slate-300 flex-1">{r.label}</span>
                <input
                  type="time"
                  value={r.time}
                  disabled={!r.enabled}
                  onChange={(e) => setTime(r.mealId, e.target.value)}
                  className="bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-sm text-slate-100 disabled:opacity-40 focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-800 rounded-xl p-1 border border-surface-700">
        {(['logged', 'suggested'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? 'bg-accent text-white' : 'text-slate-400'
            }`}
          >
            {t === 'logged' ? 'Logged' : 'Suggested'}
          </button>
        ))}
      </div>

      {tab === 'logged' ? (
        <>
          {/* Photo analyzer + Add Food row */}
          <div className="flex items-center gap-2">
            <PhotoAnalyzer onFoodParsed={handlePhotoFood} />
            <div className="flex-1">
              <Button
                fullWidth
                variant="ghost"
                onClick={() => openAddFood(dayData.meals[0]?.id ?? 'breakfast')}
              >
                + Add Food
              </Button>
            </div>
          </div>

          {/* Meal cards */}
          {dayData.meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onAddFood={() => openAddFood(meal.id)}
              onDeleteFood={(foodId) => deleteFood(date, meal.id, foodId)}
            />
          ))}
        </>
      ) : (
        <MealSuggestions
          meals={prioritizedSuggestedMeals}
          onLogMeal={handleLogSuggestedMeal}
          loggedMealIds={loggedMealIds}
          totals={totals}
          targets={NUTRITION_TARGETS}
        />
      )}

      <AddFoodModal
        open={addFoodOpen}
        onClose={() => setAddFoodOpen(false)}
        meals={dayData.meals}
        initialMealId={activeMealId}
        onAdd={handleAddFood}
      />
    </div>
  )
}

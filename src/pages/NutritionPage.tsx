import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { MacroRing } from '../components/nutrition/MacroRing'
import { MealCard } from '../components/nutrition/MealCard'
import { AddFoodModal } from '../components/nutrition/AddFoodModal'
import { NutritionSummary } from '../components/nutrition/NutritionSummary'
import { MealSuggestions } from '../components/nutrition/MealSuggestions'
import { ShoppingList } from '../components/nutrition/ShoppingList'
import { PhotoAnalyzer } from '../components/nutrition/PhotoAnalyzer'
import { Button } from '../components/shared/Button'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { useSettings } from '../hooks/useSettings'
import { NUTRITION_TARGETS } from '../data/userProfile'
import { getMealsForDay } from '../data/mealPlan'
import { ChevronLeftIcon, ChevronRightIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import type { FoodItem } from '../types'

type MealId = 'breakfast' | 'lunch' | 'snack' | 'dinner'

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

export default function NutritionPage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [addFoodOpen, setAddFoodOpen] = useState(false)
  const [activeMealId, setActiveMealId] = useState<string>('breakfast')
  const [tab, setTab] = useState<Tab>('logged')
  const [shoppingOpen, setShoppingOpen] = useState(false)
  const [loggedMealIds, setLoggedMealIds] = useState<Set<string>>(new Set())

  const { getByDate, addFood, deleteFood, updateWater, getDayTotals } = useNutritionLog()
  const { settings } = useSettings()

  const dayData = getByDate(date)
  const totals = getDayTotals(date)
  const suggestedMeals = getMealsForDay(getDayOfWeek(date))

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const next = d.toISOString().split('T')[0]
    if (next <= today) setDate(next)
  }

  const handleAddFood = (mealId: string, food: FoodItem) => {
    addFood(date, mealId, food)
  }

  const openAddFood = (mealId: string) => {
    setActiveMealId(mealId)
    setAddFoodOpen(true)
  }

  const handleLogSuggestedMeal = (meal: import('../data/mealPlan').SuggestedMeal) => {
    meal.items.forEach((item) => {
      const food: FoodItem = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      }
      addFood(date, meal.id, food)
    })
    setLoggedMealIds((prev) => new Set([...prev, meal.id + '_suggested']))
  }

  const handlePhotoFood = (food: Omit<FoodItem, 'id'>, mealId: MealId) => {
    const fullFood: FoodItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...food,
    }
    addFood(date, mealId, fullFood)
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4">
      {/* Date nav + shopping list */}
      <div className="flex items-center justify-between">
        <PageHeader title="Nutrition" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShoppingOpen(true)}
            className="p-1.5 rounded-lg bg-surface-700 text-slate-400 hover:text-slate-200"
            title="Weekly Shopping List"
          >
            <ShoppingCartIcon className="w-4 h-4" />
          </button>
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

      <NutritionSummary totals={totals} targets={NUTRITION_TARGETS} />

      {/* Macro ring */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 p-4">
        <MacroRing
          calories={totals.calories}
          targetCalories={NUTRITION_TARGETS.calories}
          protein={totals.protein}
          targetProtein={NUTRITION_TARGETS.protein}
          carbs={totals.carbs}
          targetCarbs={NUTRITION_TARGETS.carbs}
          fat={totals.fat}
          targetFat={NUTRITION_TARGETS.fat}
        />
      </div>

      {/* Water tracker */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">Water</p>
            <p className="text-xs text-slate-500">{dayData.waterOz} / 96 oz goal</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateWater(date, dayData.waterOz - 8)}
              className="w-8 h-8 rounded-lg bg-surface-700 text-slate-300 font-bold text-lg flex items-center justify-center"
            >
              −
            </button>
            <span className="text-sm font-bold text-blue-400 w-10 text-center">
              {dayData.waterOz}oz
            </span>
            <button
              onClick={() => updateWater(date, dayData.waterOz + 8)}
              className="w-8 h-8 rounded-lg bg-surface-700 text-slate-300 font-bold text-lg flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
        <div className="mt-2 h-2 bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all"
            style={{ width: `${Math.min(100, (dayData.waterOz / 96) * 100)}%` }}
          />
        </div>
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
            {settings.anthropicApiKey && (
              <PhotoAnalyzer apiKey={settings.anthropicApiKey} onFoodParsed={handlePhotoFood} />
            )}
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
          meals={suggestedMeals}
          onLogMeal={handleLogSuggestedMeal}
          loggedMealIds={loggedMealIds}
        />
      )}

      <AddFoodModal
        open={addFoodOpen}
        onClose={() => setAddFoodOpen(false)}
        meals={dayData.meals}
        onAdd={handleAddFood}
      />

      <ShoppingList open={shoppingOpen} onClose={() => setShoppingOpen(false)} />
    </div>
  )
}

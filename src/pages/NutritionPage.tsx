import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { MacroRing } from '../components/nutrition/MacroRing'
import { MealCard } from '../components/nutrition/MealCard'
import { AddFoodModal } from '../components/nutrition/AddFoodModal'
import { NutritionSummary } from '../components/nutrition/NutritionSummary'
import { Button } from '../components/shared/Button'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { NUTRITION_TARGETS } from '../data/userProfile'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import type { FoodItem } from '../types'

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

export default function NutritionPage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [addFoodOpen, setAddFoodOpen] = useState(false)
  const [activeMealId, setActiveMealId] = useState('')

  const { getByDate, addFood, deleteFood, updateWater, getDayTotals } = useNutritionLog()

  const dayData = getByDate(date)
  const totals = getDayTotals(date)

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

      {/* Meals */}
      {dayData.meals.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          onAddFood={() => openAddFood(meal.id)}
          onDeleteFood={(foodId) => deleteFood(date, meal.id, foodId)}
        />
      ))}

      <Button
        fullWidth
        variant="ghost"
        onClick={() => openAddFood(dayData.meals[0]?.id ?? '')}
      >
        + Add Food
      </Button>

      <AddFoodModal
        open={addFoodOpen}
        onClose={() => setAddFoodOpen(false)}
        meals={dayData.meals}
        onAdd={handleAddFood}
      />

      {/* Daily targets reference */}
      <div className="bg-surface-700/40 rounded-2xl p-3 border border-surface-700">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Daily Targets</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Calories', value: NUTRITION_TARGETS.calories, unit: 'kcal' },
            { label: 'Protein', value: NUTRITION_TARGETS.protein, unit: 'g' },
            { label: 'Carbs', value: NUTRITION_TARGETS.carbs, unit: 'g' },
            { label: 'Fat', value: NUTRITION_TARGETS.fat, unit: 'g' },
          ].map(({ label, value, unit }) => (
            <div key={label}>
              <p className="text-sm font-bold text-slate-200">{value}<span className="text-[10px] text-slate-500">{unit}</span></p>
              <p className="text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

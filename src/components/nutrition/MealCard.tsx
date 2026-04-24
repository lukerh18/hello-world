import type { Meal } from '../../types'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface MealCardProps {
  meal: Meal
  onAddFood: () => void
  onDeleteFood: (foodId: string) => void
}

export function MealCard({ meal, onAddFood, onDeleteFood }: MealCardProps) {
  const totalCals = meal.foods.reduce((sum, f) => sum + f.calories, 0)

  return (
    <div className="bg-surface-800 rounded-2xl overflow-hidden border border-surface-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700">
        <div>
          <p className="text-sm font-semibold text-slate-200">{meal.name}</p>
          {totalCals > 0 && (
            <p className="text-xs text-slate-500">{Math.round(totalCals)} kcal</p>
          )}
        </div>
        <button
          onClick={onAddFood}
          className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-light transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add
        </button>
      </div>

      {meal.foods.length === 0 ? (
        <p className="text-xs text-slate-600 px-4 py-3 italic">No foods logged</p>
      ) : (
        <ul className="divide-y divide-surface-700">
          {meal.foods.map((food) => (
            <li key={food.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-slate-200 truncate">{food.name}</p>
                <p className="text-xs text-slate-500">
                  {food.calories} kcal · P {food.protein}g · C {food.carbs}g · F {food.fat}g
                </p>
              </div>
              <button
                onClick={() => onDeleteFood(food.id)}
                className="ml-2 flex-shrink-0 text-slate-600 hover:text-danger transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

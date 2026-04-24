import { useState } from 'react'
import type { SuggestedMeal } from '../../data/mealPlan'
import { getMealTotals } from '../../data/mealPlan'
import { Button } from '../shared/Button'
import { CheckCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

interface MealSuggestionsProps {
  meals: SuggestedMeal[]
  onLogMeal: (meal: SuggestedMeal) => void
  loggedMealIds: Set<string>
}

export function MealSuggestions({ meals, onLogMeal, loggedMealIds }: MealSuggestionsProps) {
  const [expanded, setExpanded] = useState<string | null>('breakfast')

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 px-1">
        Tap "Log This Meal" to instantly add to today's food log.
      </p>
      {meals.map((meal) => {
        const totals = getMealTotals(meal)
        const isLogged = loggedMealIds.has(meal.id + '_suggested')
        const isOpen = expanded === meal.id

        return (
          <div
            key={meal.id}
            className={`bg-surface-800 rounded-2xl border overflow-hidden transition-colors ${
              isLogged ? 'border-success/30' : 'border-surface-700'
            }`}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : meal.id)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isLogged
                  ? <CheckCircleSolid className="w-5 h-5 text-success flex-shrink-0" />
                  : <CheckCircleIcon className="w-5 h-5 text-slate-600 flex-shrink-0" />
                }
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-100">{meal.name}</p>
                  <p className="text-xs text-slate-500">{meal.time} · {totals.calories} kcal</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                <div className="hidden sm:flex gap-3 text-xs text-slate-500">
                  <span><span className="text-blue-400 font-semibold">{totals.protein}g</span> P</span>
                  <span><span className="text-accent font-semibold">{totals.carbs}g</span> C</span>
                  <span><span className="text-warn font-semibold">{totals.fat}g</span> F</span>
                </div>
                <span className="text-slate-600 text-lg">{isOpen ? '−' : '+'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-surface-700 pt-3 space-y-3">
                {/* Macro pills - mobile */}
                <div className="flex gap-3 sm:hidden text-xs">
                  <span className="bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded-full font-semibold">{totals.protein}g P</span>
                  <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold">{totals.carbs}g C</span>
                  <span className="bg-warn/10 text-warn px-2 py-0.5 rounded-full font-semibold">{totals.fat}g F</span>
                </div>

                {/* Food items */}
                <ul className="space-y-1.5">
                  {meal.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-xs">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-slate-500">{item.serving} · {item.calories} kcal</span>
                    </li>
                  ))}
                </ul>

                <Button
                  fullWidth
                  size="sm"
                  variant={isLogged ? 'secondary' : 'primary'}
                  onClick={() => onLogMeal(meal)}
                  disabled={isLogged}
                >
                  {isLogged ? (
                    '✓ Logged'
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <PlusCircleIcon className="w-4 h-4" />
                      Log This Meal
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

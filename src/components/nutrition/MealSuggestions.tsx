import { useEffect, useState } from 'react'
import type { SuggestedMeal } from '../../data/mealPlan'
import { getMealTotals } from '../../data/mealPlan'
import { Button } from '../shared/Button'
import { CheckCircleIcon, PlusCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { supabase } from '../../lib/supabase'
import type { MacroTotals, NutritionTargets } from '../../types'

interface MealSuggestionsProps {
  meals: SuggestedMeal[]
  onLogMeal: (meal: SuggestedMeal) => void
  loggedMealIds: Set<string>
  totals: MacroTotals
  targets: NutritionTargets
}

interface MealRanking {
  id: string
  fitScore: number
  reason: string
  caution?: string
}

interface MacroGuidance {
  headline: string
  summary: string
  eatMore: string[]
  easeUp: string[]
  mealRankings: MealRanking[]
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: unknown })?.context
  if (context instanceof Response) {
    const payload = await context.clone().json().catch(() => null) as { error?: string } | null
    if (payload?.error) return payload.error

    const text = await context.clone().text().catch(() => '')
    if (text) return text
  }

  const message = error instanceof Error ? error.message : 'Failed to get macro guidance'
  return message === 'Edge Function returned a non-2xx status code'
    ? 'AI macro guidance failed. Check that the Supabase function is deployed and its Anthropic key is configured.'
    : message
}

function getRemaining(totals: MacroTotals, targets: NutritionTargets) {
  return {
    calories: Math.round(targets.calories - totals.calories),
    protein: Math.round(targets.protein - totals.protein),
    carbs: Math.round(targets.carbs - totals.carbs),
    fat: Math.round(targets.fat - totals.fat),
    sugar: Math.round((targets.sugar ?? 40) - totals.sugar),
  }
}

export function MealSuggestions({ meals, onLogMeal, loggedMealIds, totals, targets }: MealSuggestionsProps) {
  const [guidance, setGuidance] = useState<MacroGuidance | null>(null)
  const [guidanceLoading, setGuidanceLoading] = useState(false)
  const [guidanceError, setGuidanceError] = useState<string | null>(null)
  const mealSignature = meals.map((meal) => meal.id).join('|')
  const rankingByMealId = new Map(guidance?.mealRankings.map((ranking) => [ranking.id, ranking]))
  const rankedMeals = guidance?.mealRankings.length
    ? [...meals].sort((a, b) => (rankingByMealId.get(b.id)?.fitScore ?? -1) - (rankingByMealId.get(a.id)?.fitScore ?? -1))
    : meals
  const recommendedMeal = rankedMeals[0]
  const recommendedMealId = recommendedMeal?.id
  const [expanded, setExpanded] = useState<string | null>(recommendedMealId)
  const remaining = getRemaining(totals, targets)

  useEffect(() => {
    setExpanded(recommendedMealId)
  }, [recommendedMealId])

  useEffect(() => {
    setGuidance(null)
    setGuidanceError(null)
  }, [mealSignature, totals.calories, totals.protein, totals.carbs, totals.fat, totals.sugar])

  const handleGetGuidance = async () => {
    setGuidanceLoading(true)
    setGuidanceError(null)
    try {
      const mealOptions = meals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        time: meal.time,
        totals: getMealTotals(meal),
        items: meal.items.map((item) => `${item.name} (${item.serving})`),
      }))
      const { data, error } = await supabase.functions.invoke('macro-meal-guidance', {
        body: { totals, targets, meals: mealOptions },
      })
      if (error) throw new Error(await getFunctionErrorMessage(error))
      if (data?.error) throw new Error(data.error)
      setGuidance(data as MacroGuidance)
    } catch (e) {
      setGuidanceError(e instanceof Error ? e.message : 'Failed to get macro guidance')
    } finally {
      setGuidanceLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {recommendedMeal && (
        <div className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3">
          <div className="flex items-start gap-2">
            <SparklesIcon className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {guidance ? 'AI macro pick' : 'Suggested now'}: {recommendedMeal.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {guidance?.summary ?? 'Based on the selected day, current time, and what is not logged yet.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-surface-700 bg-surface-800 p-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              {guidance?.headline ?? 'Dial in the rest of today'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Remaining: {remaining.calories} kcal · {remaining.protein}g P · {remaining.carbs}g C · {remaining.fat}g F
            </p>
          </div>
          <Button size="sm" variant={guidance ? 'secondary' : 'primary'} onClick={handleGetGuidance} disabled={guidanceLoading}>
            <span className="flex items-center justify-center gap-1">
              <SparklesIcon className={`w-4 h-4 ${guidanceLoading ? 'animate-pulse' : ''}`} />
              {guidanceLoading ? 'Analyzing' : guidance ? 'Refresh' : 'AI Coach'}
            </span>
          </Button>
        </div>

        {guidanceError && <p className="text-xs text-danger">{guidanceError}</p>}

        {guidance && (
          <div className="grid grid-cols-2 gap-2">
            <GuidanceList title="Prioritize" items={guidance.eatMore} tone="good" />
            <GuidanceList title="Ease up" items={guidance.easeUp} tone="watch" />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 px-1">
        Tap "Log This Meal" to instantly add the best fit or another meal below.
      </p>
      {rankedMeals.map((meal) => {
        const totals = getMealTotals(meal)
        const isLogged = loggedMealIds.has(meal.id + '_suggested')
        const isOpen = expanded === meal.id
        const isRecommended = meal.id === recommendedMealId
        const ranking = rankingByMealId.get(meal.id)

        return (
          <div
            key={meal.id}
            className={`bg-surface-800 rounded-2xl border overflow-hidden transition-colors ${
              isLogged ? 'border-success/30' : isRecommended ? 'border-accent/40' : 'border-surface-700'
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100">{meal.name}</p>
                    {isRecommended && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        {guidance ? 'Best fit' : 'Now'}
                      </span>
                    )}
                    {ranking && (
                      <span className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        {ranking.fitScore}% fit
                      </span>
                    )}
                  </div>
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

                {ranking && (
                  <div className="rounded-xl bg-surface-700 px-3 py-2">
                    <p className="text-xs text-slate-300">{ranking.reason}</p>
                    {ranking.caution && <p className="text-[11px] text-warn mt-1">{ranking.caution}</p>}
                  </div>
                )}

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

function GuidanceList({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'watch' }) {
  const color = tone === 'good' ? 'text-success' : 'text-warn'

  return (
    <div className="rounded-xl bg-surface-700 p-2">
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${color}`}>{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 space-y-1">
          {items.map((item) => (
            <li key={item} className="text-xs text-slate-300 leading-snug">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-slate-500">Nothing urgent.</p>
      )}
    </div>
  )
}

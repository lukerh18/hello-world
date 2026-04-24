import { ProgressBar } from '../shared/ProgressBar'
import type { MacroTotals, NutritionTargets } from '../../types'

interface NutritionSummaryProps {
  totals: MacroTotals
  targets: NutritionTargets
}

export function NutritionSummary({ totals, targets }: NutritionSummaryProps) {
  return (
    <div className="bg-surface-800 rounded-2xl p-4 border border-surface-700 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-200">Daily Nutrition</span>
        <span className="text-sm font-bold text-accent">
          {Math.round(totals.calories)}
          <span className="text-slate-500 font-normal text-xs"> / {targets.calories} kcal</span>
        </span>
      </div>
      <ProgressBar value={totals.calories} max={targets.calories} color="bg-accent" height="h-2.5" />
      <div className="grid grid-cols-3 gap-2 pt-1">
        <MacroBar label="Protein" value={totals.protein} target={targets.protein} color="bg-blue-400" />
        <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} color="bg-accent" />
        <MacroBar label="Fat" value={totals.fat} target={targets.fat} color="bg-warn" />
      </div>
    </div>
  )
}

function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string
  value: number
  target: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-semibold">{Math.round(value)}g</span>
      </div>
      <ProgressBar value={value} max={target} color={color} height="h-1.5" />
      <p className="text-[10px] text-slate-600 text-right">{target}g goal</p>
    </div>
  )
}

import { ProgressBar } from '../shared/ProgressBar'
import type { MacroTotals, NutritionTargets } from '../../types'

interface NutritionSummaryProps {
  totals: MacroTotals
  targets: NutritionTargets
  title?: string
  embedded?: boolean
  className?: string
}

export function NutritionSummary({
  totals,
  targets,
  title = 'Daily Nutrition',
  embedded = false,
  className = '',
}: NutritionSummaryProps) {
  const sugarTarget = targets.sugar ?? 40

  return (
    <div className={`${embedded ? 'space-y-3' : 'bg-surface-800 rounded-2xl p-4 border border-surface-700 space-y-3'} ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <span className="text-sm font-bold text-accent">
          {Math.round(totals.calories)}
          <span className="text-slate-500 font-normal text-xs"> / {targets.calories} kcal</span>
        </span>
      </div>
      <ProgressBar value={totals.calories} max={targets.calories} color="bg-accent" height="h-2.5" />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <MacroBar label="Protein" value={totals.protein} target={targets.protein} color="bg-blue-400" />
        <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} color="bg-accent" />
        <MacroBar label="Fat" value={totals.fat} target={targets.fat} color="bg-warn" />
        <MacroBar
          label="Sugar"
          value={totals.sugar}
          target={sugarTarget}
          color={totals.sugar > sugarTarget ? 'bg-red-500' : 'bg-rose-500'}
          warn={totals.sugar > sugarTarget}
        />
      </div>
    </div>
  )
}

function MacroBar({
  label,
  value,
  target,
  color,
  warn,
}: {
  label: string
  value: number
  target: number
  color: string
  warn?: boolean
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={warn ? 'text-red-400' : 'text-slate-400'}>{label}</span>
        <span className={`font-semibold ${warn ? 'text-red-400' : 'text-slate-300'}`}>{Math.round(value)}g</span>
      </div>
      <ProgressBar value={value} max={target} color={color} height="h-1.5" />
      <p className="text-[10px] text-slate-600 text-right">{target}g goal</p>
    </div>
  )
}

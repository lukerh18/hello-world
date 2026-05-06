import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { MealPreset } from '../../data/mealLibrary'
import { useMealPresets } from '../../hooks/useMealPresets'

interface MealSlotPickerProps {
  open: boolean
  slotLabel: string
  category: MealPreset['category']
  onSelect: (preset: MealPreset) => void
  onCustom: () => void
  onClose: () => void
}

export function MealSlotPicker({ open, slotLabel, category, onSelect, onCustom, onClose }: MealSlotPickerProps) {
  const { getPresetsByCategory } = useMealPresets()

  if (!open) return null

  const presets = getPresetsByCategory(category)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-surface-900 rounded-2xl border border-surface-700 w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700">
          <h3 className="text-sm font-semibold text-slate-100">Log {slotLabel}</h3>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              className="w-full flex items-center gap-3 p-3 bg-surface-800 rounded-xl border border-surface-700 hover:border-accent/40 transition-colors text-left"
            >
              <span className="text-2xl flex-shrink-0">{preset.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100">{preset.name}</p>
                <p className="text-xs text-slate-500 truncate">{preset.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-200">{preset.calories}</p>
                <p className="text-[10px] text-slate-500">kcal</p>
              </div>
            </button>
          ))}

          <button
            onClick={onCustom}
            className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-surface-600 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm">Add custom meal</span>
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { MealSlotPicker } from './MealSlotPicker'
import type { Supplement } from '../../data/supplements'
import type { MealPreset } from '../../data/mealLibrary'

interface MealSlot {
  id: string
  label: string
  category: MealPreset['category']
  optional?: boolean
  loggedName?: string
}

interface AgendaBlockProps {
  label: string
  timeRange: string
  defaultExpanded?: boolean
  supplements?: Supplement[]
  mealSlots?: MealSlot[]
  children?: React.ReactNode  // for workout card
  isChecked: (id: string) => boolean
  onToggle: (id: string) => void
  onCheckAll: (ids: string[]) => void
  onLogMeal: (slot: MealSlot, preset: MealPreset) => void
  onCustomMeal: () => void
}

export function AgendaBlock({
  label,
  timeRange,
  defaultExpanded = false,
  supplements = [],
  mealSlots = [],
  children,
  isChecked,
  onToggle,
  onCheckAll,
  onLogMeal,
  onCustomMeal,
}: AgendaBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null)

  const allIds = [
    ...supplements.map((s) => `supp-${s.id}`),
    ...mealSlots.map((m) => `meal-${m.id}`),
  ]
  const doneCount = allIds.filter(isChecked).length
  const totalCount = allIds.length
  const allDone = doneCount === totalCount && totalCount > 0

  return (
    <>
      <div className={`bg-surface-800 rounded-2xl border overflow-hidden transition-colors ${allDone ? 'border-success/30' : 'border-surface-700'}`}>
        {/* Header */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-3">
            {allDone
              ? <CheckCircleSolid className="w-5 h-5 text-success" />
              : <CheckCircleIcon className="w-5 h-5 text-slate-600" />
            }
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-100">{label}</p>
              <p className="text-xs text-slate-500">{timeRange}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{doneCount}/{totalCount}</span>
            <span className="text-slate-600 text-lg">{expanded ? '−' : '+'}</span>
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-4 border-t border-surface-700 pt-3 space-y-2">
            {/* Supplement items */}
            {supplements.map((supp) => {
              const id = `supp-${supp.id}`
              const done = isChecked(id)
              return (
                <button
                  key={id}
                  onClick={() => onToggle(id)}
                  className="w-full flex items-center gap-3 py-2"
                >
                  {done
                    ? <CheckCircleSolid className="w-4 h-4 text-success flex-shrink-0" />
                    : <CheckCircleIcon className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  }
                  <span className={`text-sm flex-1 text-left ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {supp.name}
                  </span>
                  <span className="text-xs text-slate-500">{supp.dose}</span>
                </button>
              )
            })}

            {/* Meal slots */}
            {mealSlots.map((slot) => {
              const id = `meal-${slot.id}`
              const done = isChecked(id)
              return (
                <div key={id} className="flex items-center gap-2">
                  <button
                    onClick={() => onToggle(id)}
                    className="flex-shrink-0"
                  >
                    {done
                      ? <CheckCircleSolid className="w-4 h-4 text-success" />
                      : <CheckCircleIcon className="w-4 h-4 text-slate-600" />
                    }
                  </button>
                  <button
                    onClick={() => setPickerSlot(slot)}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
                      done
                        ? 'bg-success/10 border-success/30 text-slate-400'
                        : 'bg-surface-700 border-surface-600 text-slate-300 hover:border-accent/40'
                    }`}
                  >
                    <span className="text-sm">
                      {done && slot.loggedName ? slot.loggedName : slot.label}
                      {slot.optional && !done && (
                        <span className="text-slate-500 text-xs ml-1">(optional)</span>
                      )}
                    </span>
                    {!done && <span className="text-xs text-slate-500">tap to log →</span>}
                  </button>
                </div>
              )
            })}

            {/* Workout or other children */}
            {children}

            {/* Check All button */}
            {!allDone && (
              <button
                onClick={() => onCheckAll(allIds)}
                className="w-full mt-1 py-2 rounded-xl bg-surface-700 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Check All {label} ✓
              </button>
            )}
          </div>
        )}
      </div>

      {pickerSlot && (
        <MealSlotPicker
          open={true}
          slotLabel={pickerSlot.label}
          category={pickerSlot.category}
          onSelect={(preset) => {
            onLogMeal(pickerSlot, preset)
            // Also mark the meal slot as checked
            onToggle(`meal-${pickerSlot.id}`)
            setPickerSlot(null)
          }}
          onCustom={() => { onCustomMeal(); setPickerSlot(null) }}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </>
  )
}

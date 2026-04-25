import { useState, useEffect, useRef } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { MealSlotPicker } from './MealSlotPicker'
import { celebrateBlock, celebrateSingle } from '../../utils/celebrate'
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
  children?: React.ReactNode
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
  const [justChecked, setJustChecked] = useState<Set<string>>(new Set())
  const [glowing, setGlowing] = useState(false)
  const prevDoneRef = useRef(0)

  const allIds = [
    ...supplements.map((s) => `supp-${s.id}`),
    ...mealSlots.map((m) => `meal-${m.id}`),
  ]
  const doneCount = allIds.filter(isChecked).length
  const totalCount = allIds.length
  const allDone = doneCount === totalCount && totalCount > 0

  // Celebrate when block first becomes fully complete
  useEffect(() => {
    if (allDone && prevDoneRef.current < totalCount && totalCount > 0) {
      celebrateBlock()
      setGlowing(true)
      setTimeout(() => setGlowing(false), 1400)
    }
    prevDoneRef.current = doneCount
  }, [allDone, doneCount, totalCount])

  const handleToggle = (id: string) => {
    const wasChecked = isChecked(id)
    onToggle(id)
    if (!wasChecked) {
      celebrateSingle()
      setJustChecked((prev) => {
        const next = new Set(prev)
        next.add(id)
        setTimeout(() => setJustChecked((s) => { const n = new Set(s); n.delete(id); return n }), 400)
        return next
      })
    }
  }

  return (
    <>
      <div className={`rounded-2xl border overflow-hidden transition-all duration-300 card-highlight ${
        glowing ? 'animate-block-glow glow-success border-success/40' :
        allDone  ? 'bg-surface-800 border-success/25' :
                   'bg-surface-800 border-surface-600'
      }`}>
        {/* Header */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className={allDone ? 'animate-check-pop' : ''} key={allDone ? 'done' : 'pending'}>
              {allDone
                ? <CheckCircleSolid className="w-5 h-5 text-success" />
                : <CheckCircleIcon  className="w-5 h-5 text-slate-600" />
              }
            </span>
            <div className="text-left">
              <p className={`text-sm font-semibold ${allDone ? 'text-success' : 'text-slate-100'}`}>{label}</p>
              <p className="text-xs text-slate-500">{timeRange}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${allDone ? 'text-success' : 'text-slate-500'}`}>
              {doneCount}/{totalCount}
            </span>
            <span className="text-slate-600 text-lg">{expanded ? '−' : '+'}</span>
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-4 border-t border-surface-600 pt-3 space-y-2 animate-fade-up">
            {/* Supplement items */}
            {supplements.map((supp) => {
              const id = `supp-${supp.id}`
              const done = isChecked(id)
              const popping = justChecked.has(id)
              return (
                <button
                  key={id}
                  onClick={() => handleToggle(id)}
                  className="w-full flex items-center gap-3 py-2 group"
                >
                  <span className={popping ? 'animate-check-pop' : ''}>
                    {done
                      ? <CheckCircleSolid className="w-4 h-4 text-success flex-shrink-0" />
                      : <CheckCircleIcon  className="w-4 h-4 text-slate-600 flex-shrink-0 group-hover:text-slate-400 transition-colors" />
                    }
                  </span>
                  <span className={`text-sm flex-1 text-left transition-colors ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {supp.name}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{supp.dose}</p>
                    {supp.note && <p className="text-[10px] text-slate-600">{supp.note}</p>}
                  </div>
                </button>
              )
            })}

            {/* Meal slots */}
            {mealSlots.map((slot) => {
              const id = `meal-${slot.id}`
              const done = isChecked(id)
              const popping = justChecked.has(id)
              return (
                <div key={id} className="flex items-center gap-2">
                  <button onClick={() => handleToggle(id)} className="flex-shrink-0">
                    <span className={popping ? 'animate-check-pop' : ''}>
                      {done
                        ? <CheckCircleSolid className="w-4 h-4 text-success" />
                        : <CheckCircleIcon  className="w-4 h-4 text-slate-600" />
                      }
                    </span>
                  </button>
                  <button
                    onClick={() => setPickerSlot(slot)}
                    className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                      done
                        ? 'bg-success/10 border-success/30 text-slate-400'
                        : 'bg-surface-700 border-surface-600 text-slate-300 hover:border-accent/40 hover:bg-surface-600/50'
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {slot.label}
                      {slot.optional && !done && (
                        <span className="text-slate-500 text-xs ml-1 font-normal">(optional)</span>
                      )}
                    </span>
                    {!done && <span className="text-[11px] text-slate-500">tap to log →</span>}
                  </button>
                </div>
              )
            })}

            {/* Workout or other children */}
            {children}

            {/* Check All */}
            {!allDone && (
              <button
                onClick={() => {
                  allIds.filter((id) => !isChecked(id)).forEach((id) => {
                    setJustChecked((prev) => {
                      const next = new Set(prev)
                      next.add(id)
                      setTimeout(() => setJustChecked((s) => { const n = new Set(s); n.delete(id); return n }), 400)
                      return next
                    })
                  })
                  onCheckAll(allIds)
                }}
                className="w-full mt-1 py-2.5 rounded-xl bg-surface-700 text-xs font-semibold text-slate-400 hover:text-white hover:bg-surface-600 transition-all"
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
            handleToggle(`meal-${pickerSlot.id}`)
            setPickerSlot(null)
          }}
          onCustom={() => { onCustomMeal(); setPickerSlot(null) }}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </>
  )
}

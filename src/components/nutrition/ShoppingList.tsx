import { useState } from 'react'
import { Modal } from '../shared/Modal'
import { WEEKLY_SHOPPING_LIST, SHOPPING_CATEGORIES } from '../../data/mealPlan'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

interface ShoppingListProps {
  open: boolean
  onClose: () => void
}

export function ShoppingList({ open, onClose }: ShoppingListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const total = WEEKLY_SHOPPING_LIST.length
  const done = checked.size

  return (
    <Modal open={open} onClose={onClose} title="Weekly Shopping List">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">7-day ingredient list · tap to check off</p>
          {done > 0 && (
            <button
              onClick={() => setChecked(new Set())}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Reset
            </button>
          )}
        </div>

        {/* Progress bar */}
        {done > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${(done / total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-right">{done}/{total} items</p>
          </div>
        )}

        {SHOPPING_CATEGORIES.map((category) => {
          const items = WEEKLY_SHOPPING_LIST.filter((i) => i.category === category)
          return (
            <section key={category}>
              <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
                {category}
              </h3>
              <ul className="space-y-1">
                {items.map((item) => {
                  const isChecked = checked.has(item.name)
                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => toggle(item.name)}
                        className="w-full flex items-start gap-3 py-2 text-left"
                      >
                        {isChecked
                          ? <CheckCircleSolid className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                          : <CheckCircleIcon className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                        }
                        <div className="min-w-0">
                          <span className={`text-sm ${isChecked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-500 ml-2">{item.quantity}</span>
                          {item.note && (
                            <p className="text-xs text-slate-600 mt-0.5">{item.note}</p>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </Modal>
  )
}

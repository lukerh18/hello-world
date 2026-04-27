import { useState, useRef } from 'react'
import { CheckCircleIcon as CheckOutline, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import { useHabits } from '../hooks/useHabits'
import { getDailyChore, CATEGORY_META } from '../data/habits'
import type { HabitCategory } from '../data/habits'
import { celebrateSingle, celebrateBlock } from '../utils/celebrate'

const CATEGORY_ORDER: HabitCategory[] = ['spiritual', 'practical', 'startup', 'kids']

const EMOJI_OPTIONS = ['🙏', '📓', '📖', '🛏️', '🚿', '💡', '👨‍👧‍👦', '🏃', '🧘', '📚', '✍️', '💪', '🎯', '🌅', '🧹', '💻', '🎸', '🍎', '🌿', '⭐']

function EditableText({
  value,
  placeholder,
  onSave,
  className = '',
  multiline = false,
}: {
  value: string
  placeholder: string
  onSave: (v: string) => void
  className?: string
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => {
    onSave(draft)
    setEditing(false)
  }

  if (editing) {
    const props = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) commit()
        if (e.key === 'Escape') setEditing(false)
      },
      autoFocus: true,
      className: `w-full bg-surface-700 rounded-lg px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-accent ${className}`,
    }
    return multiline
      ? <textarea {...props} rows={2} />
      : <input {...props} type="text" />
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true) }}
      className={`text-left w-full group flex items-start gap-1 ${className}`}
    >
      <span className={value ? 'text-slate-200' : 'text-slate-600 italic'}>
        {value || placeholder}
      </span>
      <PencilIcon className="w-3 h-3 text-slate-700 group-hover:text-slate-500 mt-0.5 flex-shrink-0 transition-colors" />
    </button>
  )
}

export default function HabitsPage() {
  const {
    todayHabits,
    northStar,
    weekFocus,
    isHabitDone,
    isChoreDone,
    toggleHabit,
    toggleChore,
    addHabit,
    deleteHabit,
    setNorthStar,
    setWeekFocus,
    streak,
    doneCount,
    totalCount,
  } = useHabits()

  const chore = getDailyChore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<HabitCategory>('practical')
  const [newIcon, setNewIcon] = useState('⭐')
  const [newWeekdaysOnly, setNewWeekdaysOnly] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const prevDoneRef = useRef(doneCount)

  const handleToggle = (id: string, currentlyDone: boolean) => {
    toggleHabit(id)
    if (!currentlyDone) celebrateSingle()
    const newDone = currentlyDone ? doneCount - 1 : doneCount + 1
    if (newDone === totalCount) celebrateBlock()
    prevDoneRef.current = newDone
  }

  const handleChoreToggle = () => {
    toggleChore()
    if (!isChoreDone) celebrateSingle()
    const newDone = isChoreDone ? doneCount - 1 : doneCount + 1
    if (newDone === totalCount) celebrateBlock()
  }

  const handleAddHabit = () => {
    if (!newName.trim()) return
    addHabit({ name: newName.trim(), category: newCategory, icon: newIcon, weekdaysOnly: newWeekdaysOnly })
    setNewName('')
    setNewIcon('⭐')
    setNewWeekdaysOnly(false)
    setShowAddForm(false)
  }

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const allDone = doneCount === totalCount && totalCount > 0

  const grouped = CATEGORY_ORDER.reduce<Record<HabitCategory, typeof todayHabits>>(
    (acc, cat) => {
      acc[cat] = todayHabits.filter((h) => h.category === cat)
      return acc
    },
    { spiritual: [], practical: [], startup: [], kids: [] }
  )

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Life</h1>
          <p className="text-xs text-slate-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${allDone ? 'text-success' : 'text-slate-300'}`}>
            {doneCount}/{totalCount}
          </p>
          {streak > 0 && (
            <p className="text-xs text-warn">🔥 {streak}-day streak</p>
          )}
        </div>
      </div>

      {/* North Star */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">🎯 North Star</p>
        <EditableText
          value={northStar}
          placeholder="Tap to set your major goal…"
          onSave={setNorthStar}
          className="text-sm font-semibold"
        />
        <div className="border-t border-surface-600 pt-2">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">This week</p>
          <EditableText
            value={weekFocus}
            placeholder="What's your focus this week?"
            onSave={setWeekFocus}
            className="text-xs"
            multiline
          />
        </div>
      </div>

      {/* Habit categories */}
      {CATEGORY_ORDER.map((cat) => {
        const habits = grouped[cat]
        if (habits.length === 0) return null
        const meta = CATEGORY_META[cat]
        const catDone = habits.filter((h) => isHabitDone(h.id)).length
        return (
          <div key={cat} className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[10px] uppercase tracking-widest font-semibold ${meta.color}`}>
                {meta.label}
              </p>
              <span className={`text-[10px] font-semibold ${catDone === habits.length ? 'text-success' : 'text-slate-600'}`}>
                {catDone}/{habits.length}
              </span>
            </div>
            {habits.map((habit) => {
              const done = isHabitDone(habit.id)
              return (
                <div key={habit.id} className="flex items-center gap-3 py-1.5 group">
                  <button
                    onClick={() => handleToggle(habit.id, done)}
                    className="flex-shrink-0"
                  >
                    {done
                      ? <CheckSolid className="w-5 h-5 text-success" />
                      : <CheckOutline className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    }
                  </button>
                  <span className="text-lg flex-shrink-0">{habit.icon}</span>
                  <span className={`text-sm flex-1 transition-colors ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {habit.name}
                    {habit.optional && !done && (
                      <span className="text-slate-600 text-xs ml-1">(optional)</span>
                    )}
                    {habit.weekdaysOnly && (
                      <span className="text-slate-600 text-xs ml-1">weekdays</span>
                    )}
                  </span>
                  {deletingId === habit.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { deleteHabit(habit.id); setDeletingId(null) }}
                        className="text-xs text-danger font-semibold"
                      >
                        Remove
                      </button>
                      <button onClick={() => setDeletingId(null)} className="text-xs text-slate-500">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(habit.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="w-3.5 h-3.5 text-slate-600 hover:text-danger transition-colors" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Today's house chore */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">House — Today</p>
        </div>
        <div className="flex items-center gap-3 py-1 group">
          <button onClick={handleChoreToggle} className="flex-shrink-0">
            {isChoreDone
              ? <CheckSolid className="w-5 h-5 text-success" />
              : <CheckOutline className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
            }
          </button>
          <span className="text-lg">{chore.icon}</span>
          <span className={`text-sm flex-1 ${isChoreDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {chore.name}
          </span>
        </div>
      </div>

      {/* Add habit */}
      {showAddForm ? (
        <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
          <p className="text-sm font-semibold text-slate-200">New Habit</p>

          {/* Emoji picker */}
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setNewIcon(e)}
                className={`text-xl rounded-lg px-2 py-1 transition-colors ${newIcon === e ? 'bg-accent/20 ring-1 ring-accent' : 'bg-surface-700 hover:bg-surface-600'}`}
              >
                {e}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
            placeholder="Habit name…"
            autoFocus
            className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent"
          />

          <div className="flex gap-2 flex-wrap">
            {(Object.keys(CATEGORY_META) as HabitCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setNewCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  newCategory === cat
                    ? `${CATEGORY_META[cat].bg} ${CATEGORY_META[cat].color} ring-1 ring-current`
                    : 'bg-surface-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={newWeekdaysOnly}
              onChange={(e) => setNewWeekdaysOnly(e.target.checked)}
              className="accent-amber-600"
            />
            Weekdays only
          </label>

          <div className="flex gap-2">
            <button
              onClick={handleAddHabit}
              disabled={!newName.trim()}
              className="flex-1 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-40"
            >
              Add Habit
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-surface-700 text-slate-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-surface-600 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="text-sm">Add a habit</span>
        </button>
      )}

    </div>
  )
}

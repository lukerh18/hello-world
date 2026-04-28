import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircleIcon as CheckOutline,
  PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon,
  BookOpenIcon, PencilSquareIcon, BoltIcon, HeartIcon, SparklesIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import { useHabits } from '../hooks/useHabits'
import { useJournal } from '../hooks/useJournal'
import { useReadingLog } from '../hooks/useReadingLog'
import { useGoals } from '../hooks/useGoals'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { getDailyChore, CATEGORY_META } from '../data/habits'
import type { HabitCategory, Habit } from '../data/habits'
import { celebrateSingle, celebrateBlock } from '../utils/celebrate'
import { getWorkoutForDay } from '../data/program'
import { NUTRITION_TARGETS } from '../data/userProfile'

const CATEGORY_ORDER: HabitCategory[] = ['spirit', 'soul_mind', 'soul_emotions', 'soul_will']
const EMOJI_OPTIONS = ['🙏', '📓', '📖', '🛏️', '🚿', '💡', '👨‍👧‍👦', '🏃', '🧘', '📚', '✍️', '💪', '🎯', '🌅', '🧹', '💻', '❤️', '🌿', '⭐', '🌙', '✅']

function getDayOfWeek(): import('../types').DayOfWeek {
  const days: import('../types').DayOfWeek[] = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  return days[new Date().getDay()]
}

// ── Inline editable text ──────────────────────────────────────────────────────
function InlineEdit({ value, placeholder, onSave, multiline = false, className = '' }: {
  value: string; placeholder: string; onSave: (v: string) => void; multiline?: boolean; className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const commit = () => { onSave(draft); setEditing(false) }
  if (editing) {
    const shared = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !multiline) commit(); if (e.key === 'Escape') setEditing(false) },
      autoFocus: true,
      className: `w-full bg-surface-700 rounded-lg px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-accent text-sm ${className}`,
    }
    return multiline ? <textarea {...shared} rows={3} /> : <input {...shared} type="text" />
  }
  return (
    <button onClick={() => { setDraft(value); setEditing(true) }} className={`text-left w-full group flex items-start gap-1.5 ${className}`}>
      <span className={value ? 'text-slate-200' : 'text-slate-600 italic'}>{value || placeholder}</span>
      <PencilSquareIcon className="w-3 h-3 text-slate-700 group-hover:text-slate-500 mt-0.5 flex-shrink-0 transition-colors" />
    </button>
  )
}

// ── Goal block with history ───────────────────────────────────────────────────
function GoalBlock({ label, color, value, history, onSave }: {
  label: string; color: string; value: string
  history: { id: string; text: string; createdAt: string }[]
  onSave: (v: string) => void
}) {
  const [showHistory, setShowHistory] = useState(false)
  const past = history.slice(1, 6)
  return (
    <div className="space-y-1">
      <p className={`text-[10px] uppercase tracking-widest font-semibold ${color}`}>{label}</p>
      <InlineEdit value={value} placeholder="Tap to set goal…" onSave={onSave} multiline className="text-sm" />
      {past.length > 0 && (
        <button onClick={() => setShowHistory((p) => !p)} className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 mt-0.5">
          {showHistory ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
          {showHistory ? 'Hide' : `${past.length} previous`}
        </button>
      )}
      {showHistory && (
        <div className="space-y-1.5 pt-1 border-l-2 border-surface-600 pl-3 ml-1">
          {past.map((h) => (
            <div key={h.id}>
              <p className="text-xs text-slate-500">{h.text}</p>
              <p className="text-[10px] text-slate-700">{new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Habit row ─────────────────────────────────────────────────────────────────
function HabitRow({ habit, done, onToggle, onDelete }: {
  habit: Habit; done: boolean; onToggle: () => void; onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="flex items-center gap-3 py-1.5 group">
      <button onClick={onToggle} className="flex-shrink-0">
        {done ? <CheckSolid className="w-5 h-5 text-success" /> : <CheckOutline className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />}
      </button>
      <span className="text-base flex-shrink-0">{habit.icon}</span>
      <span className={`text-sm flex-1 transition-colors ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
        {habit.name}
        {habit.weekdaysOnly && <span className="text-slate-600 text-xs ml-1">weekdays</span>}
      </span>
      {confirming ? (
        <div className="flex gap-2">
          <button onClick={() => { onDelete(); setConfirming(false) }} className="text-xs text-danger font-semibold">Remove</button>
          <button onClick={() => setConfirming(false)} className="text-xs text-slate-500">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <TrashIcon className="w-3.5 h-3.5 text-slate-600 hover:text-danger transition-colors" />
        </button>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HabitsPage() {
  const navigate = useNavigate()
  const {
    todayHabits, isHabitDone, isChoreDone, toggleHabit, toggleChore,
    majorTask, setMajorTask, addHabit, deleteHabit, streak, doneCount, totalCount,
  } = useHabits()
  const { todayContent, history: journalHistory, saveToday: saveJournal } = useJournal()
  const { todayEntry: readingToday, recentBook, totalPagesCurrentBook, logToday: logReading } = useReadingLog()
  const { current: goals, history: goalHistory, updateGoal } = useGoals()
  const { getTodayLog, getCompletedDates } = useWorkoutLog()
  const { getDayTotals } = useNutritionLog()

  const todayLog = getTodayLog()
  const totals = getDayTotals(new Date().toISOString().split('T')[0])
  const todayWorkout = getWorkoutForDay(getDayOfWeek())
  const workoutDone = Boolean(todayLog?.completedAt)
  const calPct = Math.min(100, Math.round((totals.calories / NUTRITION_TARGETS.calories) * 100))

  const chore = getDailyChore()
  const allDone = doneCount === totalCount && totalCount > 0
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Journal state
  const [journalDraft, setJournalDraft] = useState(todayContent)
  const [journalOpen, setJournalOpen] = useState(false)
  const journalSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleJournalChange = (text: string) => {
    setJournalDraft(text)
    if (journalSaveRef.current) clearTimeout(journalSaveRef.current)
    journalSaveRef.current = setTimeout(() => saveJournal(text), 1000)
  }

  // Reading state
  const [readingBook, setReadingBook] = useState(recentBook)
  const [readingPages, setReadingPages] = useState(readingToday?.pagesRead.toString() ?? '')
  const [readingOpen, setReadingOpen] = useState(false)

  // Add habit state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<HabitCategory>('spirit')
  const [newIcon, setNewIcon] = useState('⭐')
  const [newWeekdaysOnly, setNewWeekdaysOnly] = useState(false)
  const prevDoneRef = useRef(doneCount)

  const handleToggle = (id: string, done: boolean) => {
    toggleHabit(id)
    if (!done) celebrateSingle()
    const newDone = done ? doneCount - 1 : doneCount + 1
    if (newDone === totalCount) celebrateBlock()
    prevDoneRef.current = newDone
  }

  const handleAddHabit = () => {
    if (!newName.trim()) return
    addHabit({ name: newName.trim(), category: newCategory, icon: newIcon, weekdaysOnly: newWeekdaysOnly })
    setNewName(''); setNewIcon('⭐'); setNewWeekdaysOnly(false); setShowAddForm(false)
  }

  const grouped = CATEGORY_ORDER.reduce<Record<HabitCategory, Habit[]>>(
    (acc, cat) => { acc[cat] = todayHabits.filter((h) => h.category === cat); return acc },
    { spirit: [], soul_mind: [], soul_emotions: [], soul_will: [] }
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
          <p className={`text-lg font-bold ${allDone ? 'text-success' : 'text-slate-300'}`}>{doneCount}/{totalCount}</p>
          {streak > 0 && <p className="text-xs text-warn">🔥 {streak}-day streak</p>}
        </div>
      </div>

      {/* ── Goals ── */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">Goals</p>
        <GoalBlock label="Spirit" color="text-indigo-300" value={goals.spirit} history={goalHistory.spirit} onSave={(t) => updateGoal('spirit', t)} />
        <div className="border-t border-surface-700 pt-3">
          <GoalBlock label="Soul" color="text-yellow-400" value={goals.soul} history={goalHistory.soul} onSave={(t) => updateGoal('soul', t)} />
        </div>
        <div className="border-t border-surface-700 pt-3">
          <GoalBlock label="Body" color="text-accent" value={goals.body} history={goalHistory.body} onSave={(t) => updateGoal('body', t)} />
        </div>
      </div>

      {/* ── SPIRIT ── */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-300" />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-indigo-300">Spirit</p>
            <p className="text-[10px] text-slate-600 ml-1">— the source</p>
          </div>
          <span className={`text-[10px] font-semibold ${grouped.spirit.filter((h) => isHabitDone(h.id)).length === grouped.spirit.length && grouped.spirit.length > 0 ? 'text-success' : 'text-slate-600'}`}>
            {grouped.spirit.filter((h) => isHabitDone(h.id)).length}/{grouped.spirit.length}
          </span>
        </div>

        {grouped.spirit.map((h) => (
          <HabitRow key={h.id} habit={h} done={isHabitDone(h.id)} onToggle={() => handleToggle(h.id, isHabitDone(h.id))} onDelete={() => deleteHabit(h.id)} />
        ))}

        {/* Journal */}
        <div className="pt-2 border-t border-surface-700 mt-2">
          <button onClick={() => setJournalOpen((p) => !p)} className="flex items-center gap-2 w-full text-left">
            <PencilSquareIcon className="w-4 h-4 text-indigo-300/60" />
            <span className="text-xs text-slate-500">
              {todayContent ? 'Journal entry ✓' : 'What did God show me today?'}
            </span>
            {journalOpen ? <ChevronUpIcon className="w-3 h-3 text-slate-600 ml-auto" /> : <ChevronDownIcon className="w-3 h-3 text-slate-600 ml-auto" />}
          </button>
          {journalOpen && (
            <div className="mt-2 space-y-2">
              <textarea
                value={journalDraft || todayContent}
                onChange={(e) => handleJournalChange(e.target.value)}
                rows={4}
                placeholder="Write freely… saves automatically"
                className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-400 leading-relaxed"
              />
              {journalHistory.filter((e) => e.date !== new Date().toISOString().split('T')[0]).slice(0, 3).map((e) => (
                <div key={e.date} className="text-xs text-slate-600 border-l-2 border-surface-600 pl-2">
                  <p className="text-slate-700 mb-0.5">{new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  <p className="line-clamp-2">{e.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SOUL ── */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 px-1">Soul</p>

        {/* Mind */}
        <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <BookOpenIcon className="w-3.5 h-3.5 text-yellow-400" />
              <p className="text-[10px] uppercase tracking-widest font-semibold text-yellow-400">Mind</p>
              <p className="text-[10px] text-slate-600 ml-1">— thinking</p>
            </div>
          </div>

          {grouped.soul_mind.map((h) => (
            <HabitRow key={h.id} habit={h} done={isHabitDone(h.id)} onToggle={() => handleToggle(h.id, isHabitDone(h.id))} onDelete={() => deleteHabit(h.id)} />
          ))}

          {/* Reading tracker */}
          <div className="pt-2 border-t border-surface-700 mt-2">
            <button onClick={() => setReadingOpen((p) => !p)} className="flex items-center gap-2 w-full text-left">
              <BookOpenIcon className="w-4 h-4 text-yellow-400/60" />
              <span className="text-xs text-slate-500">
                {readingToday ? `${recentBook} · ${readingToday.pagesRead}p today · ${totalPagesCurrentBook}p total` : 'Log reading…'}
              </span>
              {readingOpen ? <ChevronUpIcon className="w-3 h-3 text-slate-600 ml-auto" /> : <ChevronDownIcon className="w-3 h-3 text-slate-600 ml-auto" />}
            </button>
            {readingOpen && (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={readingBook || recentBook}
                  onChange={(e) => setReadingBook(e.target.value)}
                  placeholder="Book title…"
                  className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={readingPages}
                    onChange={(e) => setReadingPages(e.target.value)}
                    placeholder="Pages today"
                    className="flex-1 bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400"
                  />
                  <button
                    onClick={() => { logReading(readingBook || recentBook, parseInt(readingPages) || 0); setReadingOpen(false) }}
                    disabled={!(readingBook || recentBook)}
                    className="px-4 py-2 rounded-xl bg-yellow-400/20 text-yellow-300 text-sm font-semibold disabled:opacity-40"
                  >
                    Log
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Emotions */}
        <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <HeartIcon className="w-3.5 h-3.5 text-pink-400" />
              <p className="text-[10px] uppercase tracking-widest font-semibold text-pink-400">Emotions</p>
              <p className="text-[10px] text-slate-600 ml-1">— feeling</p>
            </div>
          </div>
          {grouped.soul_emotions.map((h) => (
            <HabitRow key={h.id} habit={h} done={isHabitDone(h.id)} onToggle={() => handleToggle(h.id, isHabitDone(h.id))} onDelete={() => deleteHabit(h.id)} />
          ))}
        </div>

        {/* Will */}
        <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <BoltIcon className="w-3.5 h-3.5 text-accent" />
              <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">Will</p>
              <p className="text-[10px] text-slate-600 ml-1">— choosing</p>
            </div>
          </div>
          {grouped.soul_will.map((h) => (
            <HabitRow key={h.id} habit={h} done={isHabitDone(h.id)} onToggle={() => handleToggle(h.id, isHabitDone(h.id))} onDelete={() => deleteHabit(h.id)} />
          ))}

          {/* Major task */}
          <div className="flex items-center gap-2 pt-2 border-t border-surface-700 mt-1">
            <span className="text-base">🎯</span>
            <input
              type="text"
              value={majorTask}
              onChange={(e) => setMajorTask(e.target.value)}
              placeholder="Today's major task…"
              className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── BODY (summary) ── */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Body</p>

        {/* Workout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">💪</span>
            <div>
              <p className="text-sm text-slate-200">{todayWorkout.isRest ? 'Rest day' : todayWorkout.label}</p>
              {workoutDone && <p className="text-[10px] text-success">Completed ✓</p>}
            </div>
          </div>
          <button onClick={() => navigate('/workout')} className="text-xs text-accent font-semibold">
            {workoutDone ? 'View →' : 'Start →'}
          </button>
        </div>

        {/* Nutrition */}
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-400">Nutrition</p>
              <p className="text-xs text-slate-500">{totals.calories} / {NUTRITION_TARGETS.calories} kcal</p>
            </div>
            <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${calPct}%` }} />
            </div>
          </div>
          <button onClick={() => navigate('/nutrition')} className="text-xs text-accent font-semibold">Log →</button>
        </div>

        {/* House chore */}
        <div className="flex items-center gap-3 pt-2 border-t border-surface-700">
          <button onClick={() => { toggleChore(); if (!isChoreDone) celebrateSingle() }} className="flex-shrink-0">
            {isChoreDone ? <CheckSolid className="w-5 h-5 text-success" /> : <CheckOutline className="w-5 h-5 text-slate-600" />}
          </button>
          <span className="text-base">{chore.icon}</span>
          <span className={`text-sm flex-1 ${isChoreDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>{chore.name}</span>
          <span className="text-[10px] text-slate-600">House</span>
        </div>
      </div>

      {/* ── Add habit ── */}
      {showAddForm ? (
        <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
          <p className="text-sm font-semibold text-slate-200">New Habit</p>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button key={e} onClick={() => setNewIcon(e)}
                className={`text-xl rounded-lg px-2 py-1 transition-colors ${newIcon === e ? 'bg-accent/20 ring-1 ring-accent' : 'bg-surface-700 hover:bg-surface-600'}`}>
                {e}
              </button>
            ))}
          </div>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
            placeholder="Habit name…" autoFocus
            className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent" />
          <div className="flex gap-2 flex-wrap">
            {CATEGORY_ORDER.map((cat) => {
              const meta = CATEGORY_META[cat]
              return (
                <button key={cat} onClick={() => setNewCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${newCategory === cat ? `${meta.bg} ${meta.color} ring-1 ring-current` : 'bg-surface-700 text-slate-500 hover:text-slate-300'}`}>
                  {meta.label}
                </button>
              )
            })}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={newWeekdaysOnly} onChange={(e) => setNewWeekdaysOnly(e.target.checked)} className="accent-amber-600" />
            Weekdays only
          </label>
          <div className="flex gap-2">
            <button onClick={handleAddHabit} disabled={!newName.trim()}
              className="flex-1 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-40">Add Habit</button>
            <button onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-surface-700 text-slate-400 text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-surface-600 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors">
          <PlusIcon className="w-4 h-4" />
          <span className="text-sm">Add a habit</span>
        </button>
      )}

    </div>
  )
}

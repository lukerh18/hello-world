import { useCallback, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircleIcon as CheckOutline,
  PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon,
  BookOpenIcon, PencilSquareIcon, BoltIcon, HeartIcon, SparklesIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import { useHabits } from '../hooks/useHabits'
import { useJournal } from '../hooks/useJournal'
import { useReadingLog } from '../hooks/useReadingLog'
import { useGoals } from '../hooks/useGoals'
import { useEsvProverbs } from '../hooks/useEsvProverbs'
import { CATEGORY_META } from '../data/habits'
import { FASTER_STAGES, getFasterStage } from '../data/fasterScale'
import type { HabitCategory, Habit } from '../data/habits'
import { celebrateSingle, celebrateBlock } from '../utils/celebrate'
import { Modal } from '../components/shared/Modal'
import { CelebrationBanner, type CelebrationMessage } from '../components/shared/CelebrationBanner'

const CATEGORY_ORDER: HabitCategory[] = ['spirit', 'soul_mind', 'soul_emotions', 'soul_will']
const EMOJI_OPTIONS = ['🙏', '📓', '📖', '🛏️', '🚿', '💡', '👨‍👧‍👦', '🏃', '🧘', '📚', '✍️', '💪', '🎯', '🌅', '🧹', '💻', '❤️', '🌿', '⭐', '🌙', '✅']
const ESV_ATTRIBUTION = 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.'
interface FasterReflectionEntry {
  behavior: string
  affectsMe: string
  affectsOthers: string
  benefit: string
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
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'spirit'
  const {
    todayHabits, isHabitDone, toggleHabit,
    majorTask, setMajorTask, addHabit, deleteHabit, streak, doneCount, totalCount,
    meditationMinutes, bibleMinutes, readProverbs, fasterScaleLevel,
    setMeditationMinutes, setBibleMinutes, setReadProverbs, setFasterScaleLevel,
  } = useHabits()
  const { todayContent, history: journalHistory, saveToday: saveJournal } = useJournal()
  const { todayEntry: readingToday, recentBook, totalPagesCurrentBook, logToday: logReading } = useReadingLog()
  const { current: goals, history: goalHistory, updateGoal } = useGoals()

  const allDone = doneCount === totalCount && totalCount > 0
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const todayKey = new Date().toISOString().split('T')[0]
  const [fasterReflection, setFasterReflection] = useState<FasterReflectionEntry>(() => {
    try {
      const raw = localStorage.getItem(`faster_reflection_${todayKey}`)
      if (!raw) return { behavior: '', affectsMe: '', affectsOthers: '', benefit: '' }
      const parsed = JSON.parse(raw) as Partial<FasterReflectionEntry>
      return {
        behavior: parsed.behavior ?? '',
        affectsMe: parsed.affectsMe ?? '',
        affectsOthers: parsed.affectsOthers ?? '',
        benefit: parsed.benefit ?? '',
      }
    } catch {
      return { behavior: '', affectsMe: '', affectsOthers: '', benefit: '' }
    }
  })
  const [fasterPartOne, setFasterPartOne] = useState<Record<number, string[]>>(() => {
    try {
      const raw = localStorage.getItem(`faster_part_one_${todayKey}`)
      if (!raw) return {}
      return JSON.parse(raw) as Record<number, string[]>
    } catch {
      return {}
    }
  })
  const [boxBreathingMinutes, setBoxBreathingMinutes] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(`box_breathing_minutes_${todayKey}`)
      if (!raw) return 0
      const parsed = Number.parseInt(raw, 10)
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
    } catch {
      return 0
    }
  })
  const [spouseConnectionDone, setSpouseConnectionDone] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`spouse_connection_done_${todayKey}`) === '1'
    } catch {
      return false
    }
  })

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
  const [celebration, setCelebration] = useState<CelebrationMessage | null>(null)
  const prevDoneRef = useRef(doneCount)

  const showCelebration = (message: Omit<CelebrationMessage, 'id'>) => {
    setCelebration({ ...message, id: Date.now() })
  }
  const clearCelebration = useCallback(() => setCelebration(null), [])

  const handleToggle = (id: string, done: boolean) => {
    const now = new Date()
    const minute = now.getHours() * 60 + now.getMinutes()
    toggleHabit(id, minute)
    const habit = todayHabits.find((item) => item.id === id)
    if (!done) {
      celebrateSingle()
      showCelebration({
        tone: 'warm',
        title: `${habit?.name ?? 'Habit'} complete. Well done.`,
        detail: 'That small faithful action counts today.',
      })
    }
    const newDone = done ? doneCount - 1 : doneCount + 1
    if (newDone === totalCount) {
      celebrateBlock()
      showCelebration({
        tone: 'success',
        title: 'Daily block complete. That is a real win.',
        detail: 'Balanced consistency beats pressure. You showed up today.',
      })
    }
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
  const todayProverbs = new Date().getDate()
  const meditationDone = meditationMinutes >= 10
  const bibleDone = bibleMinutes >= 15
  const fastingRisk = fasterScaleLevel !== null && fasterScaleLevel >= 6
  const fastingHealthy = fasterScaleLevel !== null && fasterScaleLevel <= 3
  const currentFasterStage = getFasterStage(fasterScaleLevel)
  const [showProverbsModal, setShowProverbsModal] = useState(false)
  const proverbs = useEsvProverbs(todayProverbs)
  const boxBreathingDone = boxBreathingMinutes >= 10
  const currentHour = new Date().getHours()
  const isNightWindow = currentHour >= 21

  const updateFasterReflection = (patch: Partial<FasterReflectionEntry>) => {
    setFasterReflection((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem(`faster_reflection_${todayKey}`, JSON.stringify(next))
      return next
    })
  }

  const togglePartOneSignal = (level: number, signal: string) => {
    setFasterPartOne((prev) => {
      const current = prev[level] ?? []
      const nextForLevel = current.includes(signal)
        ? current.filter((s) => s !== signal)
        : [...current, signal]
      const next = { ...prev, [level]: nextForLevel }
      localStorage.setItem(`faster_part_one_${todayKey}`, JSON.stringify(next))
      return next
    })
  }

  const addBoxBreathingMinutes = (amount: number) => {
    setBoxBreathingMinutes((prev) => {
      const next = Math.max(0, prev + amount)
      localStorage.setItem(`box_breathing_minutes_${todayKey}`, String(next))
      return next
    })
  }

  const toggleSpouseConnection = () => {
    setSpouseConnectionDone((prev) => {
      const next = !prev
      localStorage.setItem(`spouse_connection_done_${todayKey}`, next ? '1' : '0')
      return next
    })
  }

  const SpiritSection = (
    <>
      {/* Spirit goal */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2">
        <p className="text-[10px] text-violet-300 uppercase tracking-widest font-semibold">Spirit Goal</p>
        <GoalBlock label="" color="text-violet-300" value={goals.spirit} history={goalHistory.spirit} onSave={(t) => updateGoal('spirit', t)} />
      </div>

      {/* Habits */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5 text-violet-300" />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-violet-300">Daily Habits</p>
          </div>
          <span className={`text-[10px] font-semibold ${grouped.spirit.filter((h) => isHabitDone(h.id)).length === grouped.spirit.length && grouped.spirit.length > 0 ? 'text-success' : 'text-slate-600'}`}>
            {grouped.spirit.filter((h) => isHabitDone(h.id)).length}/{grouped.spirit.length}
          </span>
        </div>
        {grouped.spirit.map((h) => (
          <HabitRow key={h.id} habit={h} done={isHabitDone(h.id)} onToggle={() => handleToggle(h.id, isHabitDone(h.id))} onDelete={() => deleteHabit(h.id)} />
        ))}
      </div>

      {/* Spiritual practice protocol */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-violet-300">Daily Spiritual Practice</p>
          <span className="text-[10px] text-slate-500">Meditation + Bible + FASTer</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-700 rounded-xl px-3 py-2.5 space-y-1.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Meditation</p>
            <div className="flex items-end justify-between">
              <p className={`text-lg font-semibold ${meditationDone ? 'text-success' : 'text-slate-200'}`}>{meditationMinutes}m</p>
              <p className="text-[10px] text-slate-500">Target 10m</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMeditationMinutes(meditationMinutes + 5)} className="flex-1 rounded-lg bg-violet-400/15 text-violet-300 text-xs py-1.5">+5m</button>
              <button onClick={() => setMeditationMinutes(Math.max(0, meditationMinutes - 5))} className="flex-1 rounded-lg bg-surface-600 text-slate-300 text-xs py-1.5">-5m</button>
            </div>
          </div>

          <div className="bg-surface-700 rounded-xl px-3 py-2.5 space-y-1.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Bible Reading</p>
            <div className="flex items-end justify-between">
              <p className={`text-lg font-semibold ${bibleDone ? 'text-success' : 'text-slate-200'}`}>{bibleMinutes}m</p>
              <p className="text-[10px] text-slate-500">Target 15m</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBibleMinutes(bibleMinutes + 5)} className="flex-1 rounded-lg bg-violet-400/15 text-violet-300 text-xs py-1.5">+5m</button>
              <button onClick={() => setBibleMinutes(Math.max(0, bibleMinutes - 5))} className="flex-1 rounded-lg bg-surface-600 text-slate-300 text-xs py-1.5">-5m</button>
            </div>
          </div>
        </div>

        <div className="bg-surface-700 rounded-xl px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Box Breathing</p>
            <p className={`text-[10px] font-semibold ${boxBreathingDone ? 'text-success' : 'text-slate-500'}`}>
              {boxBreathingMinutes}/10m
            </p>
          </div>
          <p className="text-xs text-slate-400">
            4 sec inhale -&gt; 4 sec hold -&gt; 4 sec exhale -&gt; 4 sec hold. Repeat with slow attention.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => addBoxBreathingMinutes(2)}
              className="flex-1 rounded-lg bg-violet-400/15 text-violet-300 text-xs py-1.5"
            >
              +2m quick reset
            </button>
            <button
              onClick={() => addBoxBreathingMinutes(5)}
              className="flex-1 rounded-lg bg-surface-600 text-slate-300 text-xs py-1.5"
            >
              +5m focused
            </button>
            <button
              onClick={() => {
                setBoxBreathingMinutes(0)
                localStorage.setItem(`box_breathing_minutes_${todayKey}`, '0')
              }}
              className="rounded-lg bg-surface-600 px-2.5 text-slate-400 text-xs"
            >
              Reset
            </button>
          </div>
          {boxBreathingDone && (
            <p className="text-xs text-success">Great work. You hit your 10-minute restoration breathing target today.</p>
          )}
        </div>

        <div className="bg-surface-700 rounded-xl px-3 py-2.5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-slate-200">Proverbs {todayProverbs}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Read Proverbs for today and your regular Bible plan.</p>
            </div>
            <button onClick={() => setShowProverbsModal(true)} className="text-xs text-violet-300 font-semibold whitespace-nowrap">
              Read in app
            </button>
          </div>
          <button
            onClick={() => setReadProverbs(!readProverbs)}
            className={`w-full rounded-lg py-2 text-xs font-semibold transition-colors ${readProverbs ? 'bg-success/20 text-success' : 'bg-surface-600 text-slate-300'}`}
          >
            {readProverbs ? '✓ Proverbs read today' : 'Mark Proverbs complete'}
          </button>
          {!proverbs.hasApiKey && (
            <p className="text-[10px] text-slate-500">
              Add <code className="text-slate-400">VITE_ESV_API_KEY</code> to enable in-app ESV text.
            </p>
          )}
        </div>

        <div className="bg-surface-700 rounded-xl px-3 py-2.5 space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">FASTer Scale Check-In</p>
          <p className="text-xs text-slate-500">
            Track your lowest point today, then choose one restoring action.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {FASTER_STAGES.map((item) => (
              <button
                key={item.level}
                onClick={() => setFasterScaleLevel(item.level)}
                className={`text-left rounded-lg px-2.5 py-2 text-xs border transition-colors ${
                  fasterScaleLevel === item.level
                    ? 'bg-violet-400/15 border-violet-300 text-violet-200'
                    : 'bg-surface-600 border-surface-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                <p><span className="font-semibold">{item.level}. </span>{item.label}</p>
                <p className="text-[11px] text-slate-400 mt-1">{item.summary}</p>
              </button>
            ))}
          </div>
          {currentFasterStage && (
            <div className="rounded-lg bg-surface-600/70 border border-surface-500 px-3 py-2 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                Current stage signals
              </p>
              {currentFasterStage.signals.map((signal) => (
                <p key={signal} className="text-xs text-slate-300">- {signal}</p>
              ))}
            </div>
          )}
          {currentFasterStage && (
            <div className="rounded-lg bg-surface-600/70 border border-surface-500 px-3 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  Part one behaviors I identify with
                </p>
                <p className="text-[10px] text-slate-500">
                  {(fasterPartOne[currentFasterStage.level] ?? []).length}/{currentFasterStage.signals.length}
                </p>
              </div>
              {currentFasterStage.signals.map((signal) => {
                const checked = (fasterPartOne[currentFasterStage.level] ?? []).includes(signal)
                return (
                  <button
                    key={`check_${currentFasterStage.level}_${signal}`}
                    onClick={() => togglePartOneSignal(currentFasterStage.level, signal)}
                    className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                      checked
                        ? 'bg-violet-400/15 text-violet-200'
                        : 'bg-surface-600 text-slate-300 hover:bg-surface-500'
                    }`}
                  >
                    <span className="text-sm leading-none">{checked ? '✓' : '○'}</span>
                    <span>{signal}</span>
                  </button>
                )
              })}
            </div>
          )}
          {currentFasterStage && (
            <p className={`text-xs ${fastingHealthy ? 'text-success' : fastingRisk ? 'text-danger' : 'text-amber-300'}`}>
              Current state: {currentFasterStage.label}. {fastingRisk ? 'Pause and restore now to avoid relapse.' : 'Keep choosing restorative actions today.'}
            </p>
          )}
          {fastingRisk && (
            <div className="flex items-start gap-2 bg-danger/10 border border-danger/30 rounded-lg px-2.5 py-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed">High-risk zone. Do one restoring action now: breathe for 2 minutes, pray, text someone safe, and step away from the trigger.</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showProverbsModal} onClose={() => setShowProverbsModal(false)} title={proverbs.title}>
        <div className="space-y-3">
          {proverbs.loading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 rounded bg-white/10 w-full" />
              <div className="h-3 rounded bg-white/10 w-11/12" />
              <div className="h-3 rounded bg-white/10 w-10/12" />
            </div>
          )}

          {proverbs.error && !proverbs.loading && (
            <div className="space-y-2">
              <p className="text-sm text-red-300">{proverbs.error}</p>
              <a
                href={`https://www.biblegateway.com/passage/?search=Proverbs+${todayProverbs}&version=ESV`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-violet-300 font-semibold"
              >
                Open Proverbs {todayProverbs} in browser
              </a>
            </div>
          )}

          {proverbs.content && !proverbs.loading && (
            <>
              <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">{proverbs.content}</p>
              <p className="text-[10px] text-slate-500 border-t border-surface-700 pt-2">{proverbs.copyright || ESV_ATTRIBUTION}</p>
            </>
          )}

          <button
            onClick={() => { setReadProverbs(true); setShowProverbsModal(false) }}
            className="w-full rounded-xl bg-success/20 text-success text-sm font-semibold py-2.5"
          >
            Mark Proverbs complete
          </button>
        </div>
      </Modal>

      {/* Journal */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3">
        <button onClick={() => setJournalOpen((p) => !p)} className="flex items-center gap-2 w-full text-left">
          <PencilSquareIcon className="w-4 h-4 text-violet-300/60" />
          <span className="text-sm text-slate-400">{todayContent ? 'Journal entry ✓' : 'What did God show me today?'}</span>
          {journalOpen ? <ChevronUpIcon className="w-3 h-3 text-slate-600 ml-auto" /> : <ChevronDownIcon className="w-3 h-3 text-slate-600 ml-auto" />}
        </button>
        {journalOpen && (
          <div className="mt-3 space-y-2">
            <textarea
              value={journalDraft || todayContent}
              onChange={(e) => handleJournalChange(e.target.value)}
              rows={5}
              placeholder="Write freely… saves automatically"
              className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-violet-400 leading-relaxed"
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

      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-violet-300 uppercase tracking-widest font-semibold">Night Check-In</p>
          <p className={`text-[10px] ${isNightWindow ? 'text-success' : 'text-slate-500'}`}>
            {isNightWindow ? '9 PM window open' : 'Before bed target'}
          </p>
        </div>
        <p className="text-xs text-slate-500">
          At around 9:00 PM, connect with your spouse, then complete Part Two before sleep.
        </p>
        <button
          onClick={toggleSpouseConnection}
          className={`w-full rounded-lg py-2 text-xs font-semibold transition-colors ${
            spouseConnectionDone ? 'bg-success/20 text-success' : 'bg-surface-700 text-slate-300'
          }`}
        >
          {spouseConnectionDone ? '✓ Spouse connection completed (9 PM)' : 'Mark spouse connection complete (9 PM)'}
        </button>
        <div className="space-y-2 border-t border-surface-700 pt-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Part Two Reflection (Before Bed)</p>
          <input
            type="text"
            value={fasterReflection.behavior}
            onChange={(e) => updateFasterReflection({ behavior: e.target.value })}
            placeholder="Most powerful behavior today"
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-400"
          />
          <input
            type="text"
            value={fasterReflection.affectsMe}
            onChange={(e) => updateFasterReflection({ affectsMe: e.target.value })}
            placeholder="How did it affect me in the moment?"
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-400"
          />
          <input
            type="text"
            value={fasterReflection.affectsOthers}
            onChange={(e) => updateFasterReflection({ affectsOthers: e.target.value })}
            placeholder="How did it affect people I love?"
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-400"
          />
          <input
            type="text"
            value={fasterReflection.benefit}
            onChange={(e) => updateFasterReflection({ benefit: e.target.value })}
            placeholder="Why did I do it? What benefit was I seeking?"
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-400"
          />
        </div>
      </div>
    </>
  )

  const SoulSection = (
    <>
      {/* Soul goal */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-2">
        <p className="text-[10px] text-amber-300 uppercase tracking-widest font-semibold">Soul Goal</p>
        <GoalBlock label="" color="text-amber-300" value={goals.soul} history={goalHistory.soul} onSave={(t) => updateGoal('soul', t)} />
      </div>

      {/* Mind */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpenIcon className="w-3.5 h-3.5 text-amber-300" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-amber-300">Mind — thinking</p>
        </div>
        {grouped.soul_mind.map((h) => (
          <HabitRow key={h.id} habit={h} done={isHabitDone(h.id)} onToggle={() => handleToggle(h.id, isHabitDone(h.id))} onDelete={() => deleteHabit(h.id)} />
        ))}
        <div className="pt-2 border-t border-surface-700 mt-2">
          <button onClick={() => setReadingOpen((p) => !p)} className="flex items-center gap-2 w-full text-left">
            <BookOpenIcon className="w-4 h-4 text-amber-300/60" />
            <span className="text-xs text-slate-500">
              {readingToday ? `${recentBook} · ${readingToday.pagesRead}p today · ${totalPagesCurrentBook}p total` : 'Log reading…'}
            </span>
            {readingOpen ? <ChevronUpIcon className="w-3 h-3 text-slate-600 ml-auto" /> : <ChevronDownIcon className="w-3 h-3 text-slate-600 ml-auto" />}
          </button>
          {readingOpen && (
            <div className="mt-2 space-y-2">
              <input type="text" value={readingBook || recentBook} onChange={(e) => setReadingBook(e.target.value)}
                placeholder="Book title…"
                className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400" />
              <div className="flex gap-2">
                <input type="number" inputMode="numeric" pattern="[0-9]*" min={0} value={readingPages} onChange={(e) => setReadingPages(e.target.value)}
                  placeholder="Pages today"
                  className="flex-1 bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400" />
                <button onClick={() => {
                  logReading(readingBook || recentBook, parseInt(readingPages) || 0)
                  celebrateSingle()
                  showCelebration({
                    tone: 'warm',
                    title: 'Reading logged. Nice work feeding your mind.',
                    detail: 'That is Soul progress, one page at a time.',
                  })
                  setReadingOpen(false)
                }}
                  disabled={!(readingBook || recentBook)}
                  className="px-4 py-2 rounded-xl bg-amber-400/20 text-amber-300 text-sm font-semibold disabled:opacity-40">Log</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emotions */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
        <div className="flex items-center gap-1.5 mb-2">
          <HeartIcon className="w-3.5 h-3.5 text-pink-400" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-pink-400">Emotions — feeling</p>
        </div>
        {grouped.soul_emotions.map((h) => (
          <HabitRow key={h.id} habit={h} done={isHabitDone(h.id)} onToggle={() => handleToggle(h.id, isHabitDone(h.id))} onDelete={() => deleteHabit(h.id)} />
        ))}
      </div>

      {/* Will */}
      <div className="bg-surface-800 rounded-2xl px-4 py-3 space-y-1">
        <div className="flex items-center gap-1.5 mb-2">
          <BoltIcon className="w-3.5 h-3.5 text-accent" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">Will — choosing</p>
        </div>
        {grouped.soul_will.map((h) => (
          <HabitRow key={h.id} habit={h} done={isHabitDone(h.id)} onToggle={() => handleToggle(h.id, isHabitDone(h.id))} onDelete={() => deleteHabit(h.id)} />
        ))}
        <div className="flex items-center gap-2 pt-2 border-t border-surface-700 mt-1">
          <span className="text-base">🎯</span>
          <input type="text" value={majorTask} onChange={(e) => setMajorTask(e.target.value)}
            placeholder="Today's major task…"
            className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 focus:outline-none" />
        </div>
      </div>
    </>
  )

  const tabLabel = tab === 'spirit' ? 'Spirit' : 'Soul'
  const tabColor = tab === 'spirit' ? 'text-violet-300' : 'text-amber-300'

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-3">

      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className={`text-2xl font-bold ${tabColor}`}>{tabLabel}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${allDone ? 'text-success' : 'text-slate-300'}`}>{doneCount}/{totalCount}</p>
          {streak > 0 && <p className="text-xs text-warn">🔥 {streak}-day streak</p>}
        </div>
      </div>

      {tab === 'spirit' ? SpiritSection : SoulSection}

      <CelebrationBanner message={celebration} onDone={clearCelebration} />

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

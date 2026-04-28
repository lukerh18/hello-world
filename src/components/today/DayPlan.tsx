import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import { CheckCircleIcon as CheckOutline } from '@heroicons/react/24/outline'
import type { CalendarEvent } from '../../hooks/useGoogleCalendar'
import type { Habit } from '../../data/habits'
import { celebrateSingle } from '../../utils/celebrate'

type TimeBlock = 'morning' | 'afternoon' | 'evening'

const BLOCK_META: Record<TimeBlock, { label: string; range: string; hours: [number, number] }> = {
  morning:   { label: 'Morning',   range: '5 AM – 12 PM',  hours: [5,  12] },
  afternoon: { label: 'Afternoon', range: '12 PM – 5 PM',  hours: [12, 17] },
  evening:   { label: 'Evening',   range: '5 PM – 10 PM',  hours: [17, 22] },
}

const HABIT_BLOCK: Record<string, { block: TimeBlock; sortMinute: number }> = {
  spirit:        { block: 'morning',   sortMinute: 5 * 60 + 30 },
  soul_mind:     { block: 'morning',   sortMinute: 8 * 60       },
  soul_will:     { block: 'afternoon', sortMinute: 9 * 60       },
  soul_emotions: { block: 'evening',   sortMinute: 18 * 60      },
}

function eventBlock(event: CalendarEvent): TimeBlock {
  if (event.allDay) return 'morning'
  const h = new Date(event.start).getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDuration(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

interface Props {
  habits: Habit[]
  isHabitDone: (id: string) => boolean
  toggleHabit: (id: string) => void
  majorTask: string
  setMajorTask: (v: string) => void
  calendarEvents: CalendarEvent[]
  checkedEventIds: string[]
  onToggleEvent: (id: string) => void
  freeSlotLabel?: string
}

export function DayPlan({
  habits, isHabitDone, toggleHabit, majorTask, setMajorTask,
  calendarEvents, checkedEventIds, onToggleEvent, freeSlotLabel,
}: Props) {
  const now = new Date()
  const currentBlock: TimeBlock =
    now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'

  return (
    <div className="space-y-3">
      {(['morning', 'afternoon', 'evening'] as TimeBlock[]).map((block) => {
        const meta = BLOCK_META[block]
        const blockEvents = calendarEvents.filter((e) => eventBlock(e) === block)
        const blockHabits = habits.filter((h) => HABIT_BLOCK[h.category]?.block === block)
        const total = blockEvents.length + blockHabits.length + (block === 'afternoon' ? 1 : 0)
        const done =
          blockEvents.filter((e) => checkedEventIds.includes(e.id)).length +
          blockHabits.filter((h) => isHabitDone(h.id)).length

        // Skip future empty blocks
        if (total === 0 && block !== currentBlock) return null

        const isCurrentBlock = block === currentBlock

        return (
          <div key={block} className={`bg-surface-800 rounded-2xl overflow-hidden ${isCurrentBlock ? 'ring-1 ring-accent/30' : ''}`}>
            {/* Block header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-700">
              <div>
                <span className={`text-xs font-semibold ${isCurrentBlock ? 'text-accent' : 'text-slate-400'}`}>
                  {meta.label}
                </span>
                <span className="text-[10px] text-slate-600 ml-2">{meta.range}</span>
                {isCurrentBlock && <span className="text-[10px] text-accent ml-2">← now</span>}
              </div>
              {total > 0 && (
                <span className={`text-[10px] font-semibold ${done === total ? 'text-success' : 'text-slate-600'}`}>
                  {done}/{total}
                </span>
              )}
            </div>

            <div className="px-4 py-2 space-y-0.5">
              {/* Free slot insight */}
              {block === 'morning' && freeSlotLabel && (
                <div className="flex items-center gap-2 py-1.5 mb-1">
                  <span className="text-[10px] text-slate-600 w-16 shrink-0">💡 free</span>
                  <span className="text-[10px] text-accent">{freeSlotLabel}</span>
                </div>
              )}

              {/* Calendar events */}
              {blockEvents.map((event) => {
                const checked = checkedEventIds.includes(event.id)
                return (
                  <button
                    key={event.id}
                    onClick={() => onToggleEvent(event.id)}
                    className="flex items-center gap-3 py-2 w-full text-left group"
                  >
                    <span className="text-[10px] text-slate-600 w-16 shrink-0 text-right">
                      {event.allDay ? 'all day' : fmtTime(event.start)}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: event.calendarColor }}
                    />
                    <span className={`text-sm flex-1 transition-colors ${checked ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                      {event.summary}
                    </span>
                    {!event.allDay && (
                      <span className="text-[10px] text-slate-700 shrink-0">{fmtDuration(event.start, event.end)}</span>
                    )}
                    {checked
                      ? <CheckSolid className="w-4 h-4 text-success shrink-0" />
                      : <CheckOutline className="w-4 h-4 text-slate-700 group-hover:text-slate-500 shrink-0" />
                    }
                  </button>
                )
              })}

              {/* Habits */}
              {blockHabits.map((h) => {
                const done = isHabitDone(h.id)
                return (
                  <button
                    key={h.id}
                    onClick={() => { toggleHabit(h.id); if (!done) celebrateSingle() }}
                    className="flex items-center gap-3 py-2 w-full text-left group"
                  >
                    <span className="text-[10px] text-slate-700 w-16 shrink-0 text-right">habit</span>
                    <span className="text-sm shrink-0">{h.icon}</span>
                    <span className={`text-sm flex-1 transition-colors ${done ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                      {h.name}
                    </span>
                    {done
                      ? <CheckSolid className="w-4 h-4 text-success shrink-0" />
                      : <CheckOutline className="w-4 h-4 text-slate-700 group-hover:text-slate-500 shrink-0" />
                    }
                  </button>
                )
              })}

              {/* Major task (afternoon Will block) */}
              {block === 'afternoon' && (
                <div className="flex items-center gap-3 py-2">
                  <span className="text-[10px] text-slate-700 w-16 shrink-0 text-right">focus</span>
                  <span className="text-sm shrink-0">🎯</span>
                  <input
                    type="text"
                    value={majorTask}
                    onChange={(e) => setMajorTask(e.target.value)}
                    placeholder="Today's major task…"
                    className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-700 focus:outline-none"
                  />
                </div>
              )}

              {total === 0 && (
                <p className="text-[10px] text-slate-700 py-2 text-center">Nothing scheduled</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

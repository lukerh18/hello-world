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

const HABIT_DURATION_MINUTES: Record<string, number> = {
  spirit: 20,
  soul_mind: 45,
  soul_will: 15,
  soul_emotions: 30,
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

function minuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

function fmtMinute(minute: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, minute))
  const h24 = Math.floor(clamped / 60)
  const m = clamped % 60
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

interface HabitPlacement {
  habitId: string
  minute: number
}

function scheduleHabitsInBlock(block: TimeBlock, events: CalendarEvent[], habits: Habit[]): HabitPlacement[] {
  const [startHour, endHour] = BLOCK_META[block].hours
  const blockStart = startHour * 60
  const blockEnd = endHour * 60

  const busy = events
    .filter((e) => !e.allDay)
    .map((e) => ({ start: minuteOfDay(new Date(e.start)), end: minuteOfDay(new Date(e.end)) }))
    .map((slot) => ({
      start: Math.max(blockStart, slot.start),
      end: Math.min(blockEnd, slot.end),
    }))
    .filter((slot) => slot.end > slot.start)
    .sort((a, b) => a.start - b.start)

  const mergedBusy: Array<{ start: number; end: number }> = []
  for (const slot of busy) {
    const prev = mergedBusy.at(-1)
    if (!prev || slot.start > prev.end) mergedBusy.push(slot)
    else prev.end = Math.max(prev.end, slot.end)
  }

  const free: Array<{ start: number; end: number }> = []
  let cursor = blockStart
  for (const slot of mergedBusy) {
    if (slot.start > cursor) free.push({ start: cursor, end: slot.start })
    cursor = Math.max(cursor, slot.end)
  }
  if (cursor < blockEnd) free.push({ start: cursor, end: blockEnd })

  const placements: HabitPlacement[] = []
  let freeIndex = 0
  let freeCursor = free[0]?.start ?? blockStart

  for (const habit of habits) {
    const preferred = HABIT_BLOCK[habit.category]?.sortMinute ?? blockStart
    const duration = HABIT_DURATION_MINUTES[habit.category] ?? 20

    while (freeIndex < free.length && free[freeIndex].end - freeCursor < duration) {
      freeIndex += 1
      freeCursor = free[freeIndex]?.start ?? blockEnd
    }

    let minute = preferred
    if (freeIndex < free.length) {
      const slot = free[freeIndex]
      const candidate = Math.max(slot.start, preferred, freeCursor)
      if (candidate + duration <= slot.end) {
        minute = candidate
        freeCursor = candidate + duration
      } else {
        minute = slot.start
        freeCursor = slot.start + duration
      }
    }

    placements.push({ habitId: habit.id, minute })
  }

  return placements
}

interface Props {
  habits: Habit[]
  isHabitDone: (id: string) => boolean
  toggleHabit: (id: string, completedAtMinute?: number) => void
  majorTask: string
  setMajorTask: (v: string) => void
  calendarEvents: CalendarEvent[]
  checkedEventIds: string[]
  onToggleEvent: (id: string) => void
  freeSlotLabel?: string
  getPreferredHabitMinute?: (id: string) => number | null
}

export function DayPlan({
  habits, isHabitDone, toggleHabit, majorTask, setMajorTask,
  calendarEvents, checkedEventIds, onToggleEvent, freeSlotLabel,
  getPreferredHabitMinute,
}: Props) {
  const now = new Date()
  const currentBlock: TimeBlock =
    now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'

  return (
    <div className="space-y-3">
      {(['morning', 'afternoon', 'evening'] as TimeBlock[]).map((block) => {
        const meta = BLOCK_META[block]
        const isWeekday = [1, 2, 3, 4, 5].includes(new Date().getDay())
        const anchors: CalendarEvent[] = isWeekday ? [
          {
            id: 'anchor-work-window',
            summary: 'Work focus window',
            start: new Date(new Date().setHours(8, 30, 0, 0)).toISOString(),
            end: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
            allDay: false,
            calendarName: 'Planner',
            calendarColor: '#64748B',
          },
          {
            id: 'anchor-lunch',
            summary: 'Lunch',
            start: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
            end: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
            allDay: false,
            calendarName: 'Planner',
            calendarColor: '#A3A3A3',
          },
          {
            id: 'anchor-daily-walk',
            summary: 'Daily walk (minimum)',
            start: new Date(new Date().setHours(12, 35, 0, 0)).toISOString(),
            end: new Date(new Date().setHours(12, 55, 0, 0)).toISOString(),
            allDay: false,
            calendarName: 'Planner',
            calendarColor: '#84CC16',
          },
          {
            id: 'anchor-startup-hour',
            summary: 'Startup play (1 hour)',
            start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
            end: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
            allDay: false,
            calendarName: 'Planner',
            calendarColor: '#F59E0B',
          },
        ] : []

        const allEvents = [...calendarEvents, ...anchors]
        const blockEvents = allEvents.filter((e) => eventBlock(e) === block)
        const blockHabits = habits.filter((h) => HABIT_BLOCK[h.category]?.block === block)
        const habitPlacements = scheduleHabitsInBlock(block, blockEvents, blockHabits)
        const placementByHabit = new Map(habitPlacements.map((p) => [p.habitId, p.minute]))
        const timeline = [
          ...blockEvents.map((event) => ({
            id: event.id,
            kind: 'event' as const,
            minute: event.allDay ? meta.hours[0] * 60 : minuteOfDay(new Date(event.start)),
            event,
          })),
          ...blockHabits.map((habit) => ({
            id: habit.id,
            kind: 'habit' as const,
            minute:
              getPreferredHabitMinute?.(habit.id) ??
              placementByHabit.get(habit.id) ??
              HABIT_BLOCK[habit.category]?.sortMinute ??
              meta.hours[0] * 60,
            habit,
          })),
        ].sort((a, b) => a.minute - b.minute)
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

              {/* Chronological timeline: calendar + habit suggestions */}
              {timeline.map((item) => {
                if (item.kind === 'event') {
                  const checked = checkedEventIds.includes(item.event.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => onToggleEvent(item.event.id)}
                      className="flex items-center gap-3 py-2 w-full text-left group"
                    >
                      <span className="text-[10px] text-slate-600 w-16 shrink-0 text-right">
                        {item.event.allDay ? 'all day' : fmtTime(item.event.start)}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.event.calendarColor }}
                      />
                      <span className={`text-sm flex-1 transition-colors ${checked ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                        {item.event.summary}
                      </span>
                      {!item.event.allDay && (
                        <span className="text-[10px] text-slate-700 shrink-0">{fmtDuration(item.event.start, item.event.end)}</span>
                      )}
                      {checked
                        ? <CheckSolid className="w-4 h-4 text-success shrink-0" />
                        : <CheckOutline className="w-4 h-4 text-slate-700 group-hover:text-slate-500 shrink-0" />
                      }
                    </button>
                  )
                }

                const done = isHabitDone(item.habit.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => { toggleHabit(item.habit.id, item.minute); if (!done) celebrateSingle() }}
                    className="flex items-center gap-3 py-2 w-full text-left group"
                  >
                    <span className="text-[10px] text-accent/80 w-16 shrink-0 text-right">{fmtMinute(item.minute)}</span>
                    <span className="text-sm shrink-0">{item.habit.icon}</span>
                    <span className={`text-sm flex-1 transition-colors ${done ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                      {item.habit.name}
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

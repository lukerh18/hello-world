import { BellIcon, CheckCircleIcon, MapIcon, MoonIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '../shared/Button'
import { useMovementLog, type MovementQuickEntry } from '../../hooks/useMovementLog'
import { useMovementPlan } from '../../hooks/useMovementPlan'
import { useMovementReminders, type MovementReminder } from '../../hooks/useMovementReminders'

interface MovementPanelProps {
  date: string
}

function actionForReminder(reminder: MovementReminder): MovementQuickEntry {
  if (reminder.suggestedType === 'call_walk') {
    return { type: 'call_walk', label: 'Call walk', minutes: 10 }
  }
  if (reminder.suggestedType === 'squats') {
    return { type: 'squats', label: '10 easy squats', count: 10 }
  }
  if (reminder.suggestedType === 'mobility') {
    return { type: 'mobility', label: 'Mobility reset', minutes: 10 }
  }
  if (reminder.suggestedType === 'walk') {
    return { type: 'walk', label: reminder.label, minutes: 10 }
  }
  return { type: 'stretch', label: '2-minute stretch', minutes: 2 }
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function MovementPanel({ date }: MovementPanelProps) {
  const { plan, isQuietNow, setQuietUntil, updateTargets } = useMovementPlan(date)
  const { todayEntries, summary, streak, weeklySummary, addEntry, deleteEntry } = useMovementLog(date)
  const { reminders, permission, requestPermission, skipReminder, getDueReminders, isNative, toggle, setTime } =
    useMovementReminders(plan)
  const dueReminders = getDueReminders(summary.breaks)

  const isHeavy = plan.mode === 'heavy_workout'
  const quickActions: MovementQuickEntry[] = [
    { type: 'walk', label: '10-min walk', minutes: 10 },
    { type: 'call_walk', label: 'Call walk', minutes: 10 },
    { type: 'stretch', label: 'Stretch', minutes: isHeavy ? 2 : 10 },
    { type: 'squats', label: '10 squats', count: 10 },
    { type: 'pushups', label: '10 push-ups', count: 10 },
  ]
  const targetPresets = isHeavy
    ? [
        { label: 'Gentle', breaks: 2, minutes: 10, reps: 20 },
        { label: 'Baseline', breaks: 3, minutes: 20, reps: 50 },
        { label: 'Stretch', breaks: 4, minutes: 30, reps: 75 },
      ]
    : [
        { label: 'Gentle', breaks: 3, minutes: 30, reps: 40 },
        { label: 'Baseline', breaks: 4, minutes: 45, reps: 80 },
        { label: 'Outdoor', breaks: 5, minutes: 60, reps: 100 },
      ]

  const logCustom = () => {
    const label = window.prompt('What movement did you do?', 'Mobility reset')
    if (!label) return
    const minutesInput = window.prompt('Minutes, if any?', '5')
    const countInput = window.prompt('Reps/count, if any?', '')
    const minutes = minutesInput ? Number(minutesInput) : 0
    const count = countInput ? Number(countInput) : 0

    addEntry({
      type: 'custom',
      label,
      minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
      count: Number.isFinite(count) && count > 0 ? count : undefined,
    })
  }

  const minutePct = Math.min(100, Math.round((summary.minutes / Math.max(1, plan.targetMinutes)) * 100))
  const breakPct = Math.min(100, Math.round((summary.breaks / Math.max(1, plan.targetBreaks)) * 100))
  const repPct = Math.min(100, Math.round((summary.reps / Math.max(1, plan.targetReps)) * 100))

  return (
    <div className="space-y-3">
      <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-accent">
              {isHeavy ? 'Heavy workout day' : 'Light movement day'}
            </p>
            <p className="text-sm text-slate-300 mt-1">{plan.modeReason}</p>
          </div>
          <span className="shrink-0 rounded-full bg-accent/10 border border-accent/30 px-2.5 py-1 text-[10px] font-semibold text-accent">
            {plan.modeSource === 'workout_plan' ? 'Workout plan' : 'Default'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-surface-700 px-3 py-2">
            <p className="text-lg font-bold text-slate-100">{summary.breaks}</p>
            <p className="text-[10px] text-slate-500">breaks</p>
          </div>
          <div className="rounded-xl bg-surface-700 px-3 py-2">
            <p className="text-lg font-bold text-slate-100">{summary.minutes}</p>
            <p className="text-[10px] text-slate-500">minutes</p>
          </div>
          <div className="rounded-xl bg-surface-700 px-3 py-2">
            <p className="text-lg font-bold text-slate-100">{streak}</p>
            <p className="text-[10px] text-slate-500">day streak</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Movement breaks</span>
              <span>{summary.breaks}/{plan.targetBreaks}</span>
            </div>
            <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${breakPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Movement minutes</span>
              <span>{summary.minutes}/{plan.targetMinutes}</span>
            </div>
            <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${minutePct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Strength snacks</span>
              <span>{summary.reps}/{plan.targetReps}</span>
            </div>
            <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
              <div className="h-full bg-warn rounded-full transition-all" style={{ width: `${repPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-200">Target feel</p>
        <div className="grid grid-cols-3 gap-2">
          {targetPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => updateTargets({ targetBreaks: preset.breaks, targetMinutes: preset.minutes, targetReps: preset.reps })}
              className={`rounded-xl border px-2 py-2 text-center ${
                plan.targetBreaks === preset.breaks && plan.targetMinutes === preset.minutes
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface-700 text-slate-300 border-surface-600'
              }`}
            >
              <p className="text-xs font-semibold">{preset.label}</p>
              <p className="text-[10px] opacity-75 mt-0.5">{preset.breaks} / {preset.minutes}m / {preset.reps}r</p>
            </button>
          ))}
        </div>
      </div>

      {dueReminders.map((reminder) => (
        <div key={reminder.id} className="bg-accent/10 border border-accent/25 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <BellIcon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-100">{reminder.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{reminder.body}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addEntry(actionForReminder(reminder))}>Done</Button>
            <Button size="sm" variant="ghost" onClick={() => skipReminder(reminder.id)}>Skip</Button>
          </div>
        </div>
      ))}

      <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-accent" />
          <p className="text-sm font-semibold text-slate-200">Quick log</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={`${action.type}-${action.label}`}
              onClick={() => addEntry(action)}
              className="rounded-xl bg-surface-700 border border-surface-600 px-3 py-3 text-left hover:border-accent/50 transition-colors"
            >
              <p className="text-sm font-semibold text-slate-100">{action.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {action.minutes ? `${action.minutes} min` : `${action.count ?? 0} reps`}
              </p>
            </button>
          ))}
          <button
            onClick={logCustom}
            className="rounded-xl bg-surface-700 border border-dashed border-surface-600 px-3 py-3 text-left hover:border-accent/50 transition-colors"
          >
            <p className="text-sm font-semibold text-slate-100">Custom</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Anything light</p>
          </button>
        </div>
      </div>

      <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-200">Habit stack</p>
            <p className="text-xs text-slate-500 mt-1">
              After every meeting ends, do 10 push-ups before sitting back down. No alarm needed.
            </p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => addEntry({ type: 'pushups', label: 'Meeting stack push-ups', count: 10 })}>
          Log 10 push-ups
        </Button>
      </div>

      <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MoonIcon className="w-4 h-4 text-accent" />
            <p className="text-sm font-semibold text-slate-200">Quiet hours</p>
          </div>
          {isQuietNow && <span className="text-[10px] text-accent font-semibold">Paused</span>}
        </div>
        <div className="flex gap-2">
          <input
            type="time"
            value={plan.quietUntil ?? ''}
            onChange={(event) => setQuietUntil(event.target.value || undefined)}
            className="flex-1 bg-surface-700 border border-surface-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent"
          />
          <Button size="sm" variant="secondary" onClick={() => setQuietUntil('15:00')}>Until 3 PM</Button>
          <Button size="sm" variant="ghost" onClick={() => setQuietUntil(undefined)}>Clear</Button>
        </div>
        <p className="text-xs text-slate-500">Pause movement pings until this time when meetings need your full focus.</p>
      </div>

      <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BellIcon className="w-4 h-4 text-accent" />
          <p className="text-sm font-semibold text-slate-200">Local iOS reminders</p>
        </div>
        {isNative ? (
          permission === 'granted' ? (
            <p className="text-xs text-slate-500">Reminders are scheduled on this device from the workout plan.</p>
          ) : permission === 'denied' ? (
            <p className="text-xs text-slate-500">Notifications are blocked. Enable them in iOS Settings to get movement reminders.</p>
          ) : (
            <Button size="sm" onClick={requestPermission}>Enable movement reminders</Button>
          )
        ) : (
          <p className="text-xs text-slate-500">Movement notifications are iOS-only. In-app prompts still appear here when the app is open.</p>
        )}
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center gap-3 rounded-xl bg-surface-700 px-3 py-2">
              <button
                onClick={() => toggle(reminder.id)}
                className={`w-9 h-5 rounded-full transition-colors shrink-0 ${reminder.enabled ? 'bg-accent' : 'bg-surface-600'}`}
              >
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${reminder.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-xs text-slate-300 flex-1">{reminder.label}</span>
              <input
                type="time"
                value={reminder.time}
                disabled={!reminder.enabled}
                onChange={(event) => setTime(reminder.id, event.target.value)}
                className="bg-surface-800 border border-surface-600 rounded-lg px-2 py-1 text-xs text-slate-100 disabled:opacity-40 focus:outline-none focus:border-accent"
              />
            </div>
          ))}
        </div>
      </div>

      {new Date(date + 'T12:00:00').getDay() === 0 && (
        <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-accent" />
            <p className="text-sm font-semibold text-slate-200">Weekly movement recap</p>
          </div>
          <p className="text-xs text-slate-500">
            {weeklySummary.walks} walks, {weeklySummary.breaks} movement breaks, {weeklySummary.reps} reps, and{' '}
            {weeklySummary.minutes} minutes logged this week. Small movement keeps body composition moving.
          </p>
        </div>
      )}

      <div className="bg-surface-800 border border-surface-700 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-200">Today's movement</p>
        {todayEntries.length === 0 ? (
          <p className="text-xs text-slate-500">No movement snacks logged yet.</p>
        ) : (
          todayEntries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-surface-700 pb-2 last:border-b-0 last:pb-0">
              <div>
                <p className="text-sm text-slate-200">{entry.label}</p>
                <p className="text-[10px] text-slate-500">
                  {formatTime(entry.completedAt)}
                  {entry.minutes ? ` / ${entry.minutes} min` : ''}
                  {entry.count ? ` / ${entry.count} reps` : ''}
                </p>
              </div>
              <button onClick={() => deleteEntry(entry.id)} className="text-slate-600 hover:text-slate-400">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

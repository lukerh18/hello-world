import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PhaseChip } from '../components/workout/PhaseChip'
import { useCurrentWeek } from '../hooks/useCurrentWeek'
import { useSettings } from '../hooks/useSettings'
import { WORKOUT_SCHEDULE, PHASE_CONFIGS, getPhaseForWeek } from '../data/program'
import { OVERLOAD_TABLE, OVERLOAD_EXERCISE_NAMES } from '../data/progressiveOverload'
import type { OverloadKey } from '../types'
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

export default function ProgramPage() {
  const { settings } = useSettings()
  const startDate = settings.programStartDate || new Date().toISOString().split('T')[0]
  const { week: currentWeek, phase: currentPhase } = useCurrentWeek(startDate)
  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [showOverload, setShowOverload] = useState(false)

  const phase = getPhaseForWeek(selectedWeek)

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4">
      <PageHeader title="12-Week Program" subtitle="Your full training plan" />

      {/* Week navigator */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
            disabled={selectedWeek <= 1}
            className="p-2 rounded-lg bg-surface-700 text-slate-400 disabled:opacity-30"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-100">Week {selectedWeek}</p>
            <PhaseChip phase={phase} week={selectedWeek} size="sm" />
            {selectedWeek === currentWeek && (
              <p className="text-[10px] text-accent mt-1 font-semibold">← Current Week</p>
            )}
          </div>
          <button
            onClick={() => setSelectedWeek((w) => Math.min(12, w + 1))}
            disabled={selectedWeek >= 12}
            className="p-2 rounded-lg bg-surface-700 text-slate-400 disabled:opacity-30"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Phase description */}
        <p className="text-xs text-slate-400 text-center">{phase.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-surface-700 rounded-lg p-2 text-center">
            <p className="text-slate-500 mb-0.5">Compound</p>
            <p className="font-semibold text-slate-200">{phase.compoundRepRange[0]}–{phase.compoundRepRange[1]} reps</p>
          </div>
          <div className="bg-surface-700 rounded-lg p-2 text-center">
            <p className="text-slate-500 mb-0.5">Isolation</p>
            <p className="font-semibold text-slate-200">{phase.isolationRepRange[0]}–{phase.isolationRepRange[1]} reps</p>
          </div>
        </div>
      </div>

      {/* Phase overview strip */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {PHASE_CONFIGS.map((p) => (
          <button
            key={p.phase}
            onClick={() => setSelectedWeek(p.weeks[0])}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              phase.phase === p.phase
                ? `${p.bgColor} ${p.color}`
                : 'bg-surface-800 text-slate-500 border border-surface-700'
            }`}
          >
            {p.label}
            <span className="ml-1 opacity-60">W{p.weeks[0]}–{p.weeks[1]}</span>
          </button>
        ))}
      </div>

      {/* Daily schedule */}
      <div className="space-y-2">
        {WORKOUT_SCHEDULE.map((day) => (
          <div
            key={day.day}
            className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden"
          >
            <button
              onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
              disabled={day.isRest}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-7 text-left">
                  {DAY_LABELS[day.day]}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-100">{day.label}</p>
                  {!day.isRest && (
                    <p className="text-xs text-slate-500">{day.focusLabel}</p>
                  )}
                </div>
              </div>
              {!day.isRest && (
                expandedDay === day.day
                  ? <ChevronUpIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  : <ChevronDownIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
              )}
            </button>

            {expandedDay === day.day && !day.isRest && (
              <div className="px-4 pb-4 space-y-2 border-t border-surface-700 pt-3">
                {day.exercises.map((ex) => {
                  const target = ex.hasProgressiveOverload
                    ? OVERLOAD_TABLE[ex.id as OverloadKey]?.[selectedWeek]
                    : undefined
                  return (
                    <div key={ex.id} className="flex items-start justify-between">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-slate-200">{ex.name}</p>
                        <p className="text-xs text-slate-500">
                          {ex.defaultSets} × {ex.repRange[0] === ex.repRange[1]
                            ? ex.repRange[0]
                            : `${ex.repRange[0]}–${ex.repRange[1]}`}
                          {ex.repUnit === 'seconds' ? 's' : ex.repUnit === 'minutes' ? ' min' : ' reps'}
                        </p>
                        {ex.notes && (
                          <p className="text-xs text-slate-600 italic mt-0.5">{ex.notes}</p>
                        )}
                      </div>
                      {target !== undefined && (
                        <span className="flex-shrink-0 text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-lg">
                          {target} lbs
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progressive Overload Table */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden">
        <button
          onClick={() => setShowOverload((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <p className="text-sm font-semibold text-slate-200">Progressive Overload Table</p>
          {showOverload
            ? <ChevronUpIcon className="w-4 h-4 text-slate-500" />
            : <ChevronDownIcon className="w-4 h-4 text-slate-500" />
          }
        </button>

        {showOverload && (
          <div className="overflow-x-auto no-scrollbar border-t border-surface-700">
            <table className="text-xs w-full min-w-[480px]">
              <thead>
                <tr className="bg-surface-700">
                  <th className="text-left px-3 py-2 text-slate-400 font-semibold sticky left-0 bg-surface-700 z-10">
                    Exercise
                  </th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th
                      key={i + 1}
                      className={`px-2 py-2 text-center font-semibold ${
                        i + 1 === currentWeek ? 'text-accent' : 'text-slate-400'
                      }`}
                    >
                      W{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {(Object.keys(OVERLOAD_TABLE) as OverloadKey[]).map((key) => (
                  <tr key={key}>
                    <td className="px-3 py-2 text-slate-300 font-medium sticky left-0 bg-surface-800 z-10">
                      {OVERLOAD_EXERCISE_NAMES[key]}
                    </td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const w = i + 1
                      const val = OVERLOAD_TABLE[key][w]
                      return (
                        <td
                          key={w}
                          className={`px-2 py-2 text-center ${
                            w === currentWeek
                              ? 'text-accent font-bold bg-accent/5'
                              : 'text-slate-400'
                          } ${w === 12 ? 'text-green-400' : ''}`}
                        >
                          {val}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div className="bg-surface-700/40 rounded-2xl p-4 border border-surface-700 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Reference</p>
        <div className="text-xs text-slate-400 space-y-1.5">
          <p><span className="text-slate-300 font-medium">Rest:</span> Compounds 90–120s · Isolation 60–90s</p>
          <p><span className="text-slate-300 font-medium">Tempo:</span> 2-1-3 (concentric · pause · eccentric)</p>
          <p><span className="text-slate-300 font-medium">Overload:</span> Add 2.5–5 lbs when you hit all target reps</p>
          <p><span className="text-slate-300 font-medium">RPE 8:</span> Could do 2 more reps · Aim for this on compound lifts</p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { StatCard } from '../components/metrics/StatCard'
import { WeightChart } from '../components/metrics/WeightChart'
import { StrengthChart } from '../components/metrics/StrengthChart'
import { MeasurementsForm } from '../components/metrics/MeasurementsForm'
import { Modal } from '../components/shared/Modal'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { useCurrentWeek } from '../hooks/useCurrentWeek'
import { DEFAULT_USER_PROFILE } from '../data/userProfile'
import { OVERLOAD_EXERCISE_NAMES } from '../data/progressiveOverload'
import { generateProgressExport } from '../utils/exportProgress'
import { WeeklyReview } from '../components/progress/WeeklyReview'
import { useSettings } from '../hooks/useSettings'
import type { OverloadKey } from '../types'
import { ScaleIcon, ArrowTrendingUpIcon, TableCellsIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline'

type Tab = 'weight' | 'strength' | 'measurements' | 'coach'

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>('weight')
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showMeasModal, setShowMeasModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportText, setExportText] = useState('')
  const [copied, setCopied] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<OverloadKey>('chest-press')

  const { metrics, latestWeight, addWeightEntry, addMeasurements } = useBodyMetrics()
  const { logs: workoutLogs, getLogsForExercise } = useWorkoutLog()
  const { logs: nutritionLogs } = useNutritionLog()
  const { settings } = useSettings()
  const startDate = settings.programStartDate || new Date().toISOString().split('T')[0]
  const { week, phase } = useCurrentWeek(startDate)

  const lbsToGoal = Math.max(0, latestWeight - DEFAULT_USER_PROFILE.goalWeightLbs)
  const totalLost = DEFAULT_USER_PROFILE.startingWeightLbs - latestWeight
  const weekWindowStart = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })()
  const weeklyWorkoutsDone = workoutLogs.filter((log) => log.date >= weekWindowStart && Boolean(log.completedAt)).length
  const weeklyProteinHits = nutritionLogs.filter((log) => {
    if (log.date < weekWindowStart) return false
    const protein = log.meals.flatMap((meal) => meal.foods).reduce((sum, food) => sum + food.protein, 0)
    return protein >= 180
  }).length
  const supplementStore = (() => {
    try {
      return JSON.parse(localStorage.getItem('supplement_completion_v1') ?? '{}') as Record<string, { completed: string[] }>
    } catch {
      return {}
    }
  })()
  const weeklySupplementRate = (() => {
    const recent = Object.entries(supplementStore).filter(([date]) => date >= weekWindowStart)
    if (recent.length === 0) return 0
    const completed = recent.reduce((sum, [, value]) => sum + (value.completed?.length ?? 0), 0)
    return Math.round((completed / (recent.length * 5)) * 100)
  })()

  const strengthData = getLogsForExercise(selectedExercise).map((entry) => {
    const weights = entry.exercise.sets.filter((s) => s.completed && s.weight > 0).map((s) => s.weight)
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0
    return {
      date: entry.date,
      weight: maxWeight,
      label: new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }
  }).filter((d) => d.weight > 0)

  const handleExport = () => {
    const text = generateProgressExport({ startDate, metrics, workoutLogs, nutritionLogs })
    setExportText(text)
    setShowExportModal(true)
    setCopied(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleLogWeight = () => {
    if (!newWeight) return
    addWeightEntry({
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(newWeight),
    })
    setNewWeight('')
    setShowWeightModal(false)
  }

  const tabs: { key: Tab; label: string; Icon: typeof ScaleIcon }[] = [
    { key: 'weight',       label: 'Weight',   Icon: ScaleIcon },
    { key: 'strength',     label: 'Strength', Icon: ArrowTrendingUpIcon },
    { key: 'measurements', label: 'Body',     Icon: TableCellsIcon },
    { key: 'coach',        label: 'Coach',    Icon: SparklesIcon },
  ]

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4">
      <PageHeader title="Progress" subtitle={`Week ${week} of 12`} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Current" value={latestWeight} unit="lbs" color="text-slate-100" />
        <StatCard
          label={totalLost >= 0 ? 'Lost' : 'Gained'}
          value={Math.abs(totalLost).toFixed(1)}
          unit="lbs"
          color={totalLost >= 0 ? 'text-success' : 'text-danger'}
        />
        <StatCard
          label="To Goal"
          value={lbsToGoal > 0 ? lbsToGoal.toFixed(1) : '🎉'}
          unit={lbsToGoal > 0 ? 'lbs' : undefined}
          color={lbsToGoal === 0 ? 'text-success' : 'text-slate-100'}
        />
      </div>

      <div className="bg-surface-800 rounded-2xl border border-surface-700 p-4">
        <p className="text-sm font-semibold text-slate-200 mb-2">Weekly Body Adherence</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Workouts completed</span>
            <span className="text-slate-200">{weeklyWorkoutsDone} sessions</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Protein target days</span>
            <span className="text-slate-200">{weeklyProteinHits} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Supplement adherence</span>
            <span className="text-slate-200">{weeklySupplementRate}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-800 rounded-xl p-1 gap-1">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === key
                ? 'bg-surface-700 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Weight Tab */}
      {tab === 'weight' && (
        <div className="space-y-4">
          <div className="bg-surface-800 rounded-2xl border border-surface-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-200">Weight History</p>
              <Button size="sm" onClick={() => setShowWeightModal(true)}>
                Log Weight
              </Button>
            </div>
            <WeightChart data={metrics.weightLog} goalWeight={DEFAULT_USER_PROFILE.goalWeightLbs} />
          </div>

          {/* Weight log table */}
          {metrics.weightLog.length > 0 && (
            <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-700">
                <p className="text-sm font-semibold text-slate-200">Log History</p>
              </div>
              <div className="divide-y divide-surface-700 max-h-64 overflow-y-auto no-scrollbar">
                {[...metrics.weightLog].reverse().map((entry) => (
                  <div key={entry.date} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-400">
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="font-semibold text-slate-100">{entry.weight} lbs</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strength Tab */}
      {tab === 'strength' && (
        <div className="space-y-4">
          <div className="bg-surface-800 rounded-2xl border border-surface-700 p-4">
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">
                Exercise
              </label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value as OverloadKey)}
                className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent"
              >
                {(Object.keys(OVERLOAD_EXERCISE_NAMES) as OverloadKey[]).map((key) => (
                  <option key={key} value={key}>
                    {OVERLOAD_EXERCISE_NAMES[key]}
                  </option>
                ))}
              </select>
            </div>
            <StrengthChart
              data={strengthData}
              exerciseName={OVERLOAD_EXERCISE_NAMES[selectedExercise]}
            />
          </div>
        </div>
      )}

      {/* Measurements Tab */}
      {tab === 'measurements' && (
        <div className="space-y-4">
          <div className="bg-surface-800 rounded-2xl border border-surface-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-200">Body Measurements</p>
              <Button size="sm" onClick={() => setShowMeasModal(true)}>
                Log
              </Button>
            </div>

            {metrics.measurements.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No measurements logged yet</p>
            ) : (
              <div className="overflow-x-auto no-scrollbar -mx-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-surface-700">
                      <th className="text-left pb-2 pr-3">Date</th>
                      <th className="text-right pb-2 px-2">Waist</th>
                      <th className="text-right pb-2 px-2">Chest</th>
                      <th className="text-right pb-2 px-2">Arms</th>
                      <th className="text-right pb-2 px-2">Thighs</th>
                      <th className="text-right pb-2">BF%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-700">
                    {[...metrics.measurements].reverse().map((m) => (
                      <tr key={m.date}>
                        <td className="py-2 pr-3 text-slate-400">
                          {new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-200">{m.waist ?? '—'}</td>
                        <td className="py-2 px-2 text-right text-slate-200">{m.chest ?? '—'}</td>
                        <td className="py-2 px-2 text-right text-slate-200">{m.arms ?? '—'}</td>
                        <td className="py-2 px-2 text-right text-slate-200">{m.thighs ?? '—'}</td>
                        <td className="py-2 text-right text-slate-200">{m.bodyFat ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weight modal */}
      <Modal open={showWeightModal} onClose={() => setShowWeightModal(false)} title="Log Weight">
        <div className="space-y-4">
          <Input
            label="Weight"
            type="number"
            step={0.1}
            min={100}
            max={400}
            unit="lbs"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder={latestWeight.toString()}
          />
          <Button fullWidth onClick={handleLogWeight} disabled={!newWeight}>
            Save
          </Button>
        </div>
      </Modal>

      {/* Coach Tab */}
      {tab === 'coach' && (
        <div className="space-y-4">
          <WeeklyReview
            healthContext={settings.healthContext}
            weekNumber={week}
            phase={phase}
            latestWeight={latestWeight}
          />
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-surface-600 text-slate-600 hover:text-slate-300 hover:border-surface-500 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="text-sm">Export for external AI coach</span>
          </button>
        </div>
      )}

      {/* Measurements modal */}
      <Modal open={showMeasModal} onClose={() => setShowMeasModal(false)} title="Log Measurements">
        <MeasurementsForm
          onSave={(m) => { addMeasurements(m); setShowMeasModal(false) }}
          latest={metrics.measurements[metrics.measurements.length - 1]}
        />
      </Modal>

      {/* Export modal */}
      <Modal open={showExportModal} onClose={() => setShowExportModal(false)} title="Progress Report">
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Copy this and paste it into Claude or Perplexity to get personalized coaching advice.
          </p>
          <textarea
            readOnly
            value={exportText}
            rows={12}
            className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono resize-none focus:outline-none"
          />
          <Button fullWidth onClick={handleCopy} variant={copied ? 'secondary' : 'primary'}>
            {copied ? '✓ Copied to Clipboard' : 'Copy to Clipboard'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

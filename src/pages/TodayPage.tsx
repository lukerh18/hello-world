import { useNavigate } from 'react-router-dom'
import { PhaseChip } from '../components/workout/PhaseChip'
import { MacroRing } from '../components/nutrition/MacroRing'
import { StatCard } from '../components/metrics/StatCard'
import { Button } from '../components/shared/Button'
import { useCurrentWeek } from '../hooks/useCurrentWeek'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { useNutritionLog } from '../hooks/useNutritionLog'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import { getWorkoutForDay } from '../data/program'
import { NUTRITION_TARGETS, DEFAULT_USER_PROFILE } from '../data/userProfile'
import { ScaleIcon, FireIcon, CalendarIcon } from '@heroicons/react/24/outline'

function getDayOfWeek(): import('../types').DayOfWeek {
  const days: import('../types').DayOfWeek[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  ]
  return days[new Date().getDay()]
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function TodayPage() {
  const navigate = useNavigate()
  const startDate = localStorage.getItem('program_start_date') ?? new Date().toISOString().split('T')[0]
  const { week, phase } = useCurrentWeek(startDate)
  const { getTodayLog, getCompletedDates } = useWorkoutLog()
  const { getDayTotals } = useNutritionLog()
  const { latestWeight } = useBodyMetrics()

  const today = new Date().toISOString().split('T')[0]
  const todayLog = getTodayLog()
  const todayWorkout = getWorkoutForDay(getDayOfWeek())
  const totals = getDayTotals(today)
  const completedDates = getCompletedDates()

  const streak = (() => {
    let s = 0
    const d = new Date()
    while (true) {
      const key = d.toISOString().split('T')[0]
      if (completedDates.includes(key)) {
        s++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return s
  })()

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const daysToGoal = daysUntil(DEFAULT_USER_PROFILE.goalDate)
  const lbsToGoal = Math.max(0, latestWeight - DEFAULT_USER_PROFILE.goalWeightLbs)

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div>
        <p className="text-slate-500 text-sm">{dayName}, {dateStr}</p>
        <h1 className="text-2xl font-bold text-slate-100 mt-0.5">{getGreeting()}, Luke 👋</h1>
        <div className="mt-2">
          <PhaseChip phase={phase} week={week} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Weight"
          value={latestWeight}
          unit="lbs"
          icon={<ScaleIcon className="w-4 h-4" />}
        />
        <StatCard
          label="To Goal"
          value={lbsToGoal > 0 ? `-${lbsToGoal}` : '✓'}
          unit={lbsToGoal > 0 ? 'lbs' : undefined}
          color={lbsToGoal === 0 ? 'text-success' : 'text-slate-100'}
          icon={<FireIcon className="w-4 h-4" />}
        />
        <StatCard
          label="Days Left"
          value={daysToGoal}
          subtext="to July 2026"
          icon={<CalendarIcon className="w-4 h-4" />}
        />
      </div>

      {/* Today's Workout Card */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today's Workout</p>
            {streak > 0 && (
              <span className="text-xs font-semibold text-warn">🔥 {streak}-day streak</span>
            )}
          </div>
          {todayWorkout.isRest ? (
            <div className="py-2">
              <p className="text-lg font-bold text-slate-100">Rest Day 😴</p>
              <p className="text-sm text-slate-400">Recovery is part of the plan. Enjoy it.</p>
            </div>
          ) : (
            <>
              <p className="text-lg font-bold text-slate-100">{todayWorkout.label}</p>
              <p className="text-sm text-slate-400">{todayWorkout.focusLabel}</p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className="text-xs bg-surface-700 text-slate-300 px-2 py-1 rounded-lg">
                  {todayWorkout.exercises.length} exercises
                </span>
                <span className="text-xs bg-surface-700 text-slate-300 px-2 py-1 rounded-lg">
                  45–55 min
                </span>
                {todayWorkout.includesCardio && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-lg">
                    + Cardio
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {!todayWorkout.isRest && (
          <div className="px-4 pb-4">
            {todayLog?.completedAt ? (
              <div className="flex items-center gap-2 bg-success/10 rounded-xl px-3 py-2.5">
                <span className="text-success text-lg">✓</span>
                <p className="text-sm font-semibold text-success">Workout Complete!</p>
              </div>
            ) : (
              <Button
                fullWidth
                size="lg"
                onClick={() => navigate('/workout')}
              >
                {todayLog ? 'Continue Workout →' : 'Start Workout →'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Nutrition Preview */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nutrition Today</p>
          <button
            onClick={() => navigate('/nutrition')}
            className="text-xs text-accent font-semibold hover:text-accent-light"
          >
            Log Food →
          </button>
        </div>
        <MacroRing
          calories={totals.calories}
          targetCalories={NUTRITION_TARGETS.calories}
          protein={totals.protein}
          targetProtein={NUTRITION_TARGETS.protein}
          carbs={totals.carbs}
          targetCarbs={NUTRITION_TARGETS.carbs}
          fat={totals.fat}
          targetFat={NUTRITION_TARGETS.fat}
          size={120}
        />
      </div>

      {/* Warmup Reminder */}
      <div className="bg-surface-700/50 rounded-2xl p-3 border border-surface-700">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Warm-Up</p>
        <p className="text-xs text-slate-400">5 min treadmill + arm circles, leg swings, hip circles, band pull-aparts</p>
      </div>
    </div>
  )
}

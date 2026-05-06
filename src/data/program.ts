import type { DayOfWeek, WorkoutDay, PhaseConfig, ExerciseDefinition } from '../types'

// ─── Exercise Definitions ─────────────────────────────────────────────────────

const chestPress: ExerciseDefinition = {
  id: 'chest-press',
  name: 'Tonal Chest Press',
  equipment: ['tonal'],
  defaultSets: 4,
  repRange: [8, 12],
  hasProgressiveOverload: true,
  notes: 'Increase 2.5 lbs/week',
}

const inclineDBPress: ExerciseDefinition = {
  id: 'incline-db-press',
  name: 'Incline Dumbbell Press',
  equipment: ['kettlebell'],
  defaultSets: 3,
  repRange: [10, 12],
  hasProgressiveOverload: false,
  notes: 'Controlled tempo',
}

const ohPress: ExerciseDefinition = {
  id: 'oh-press',
  name: 'Overhead Press (Tonal)',
  equipment: ['tonal'],
  defaultSets: 3,
  repRange: [8, 10],
  hasProgressiveOverload: true,
  notes: 'Strict form, brace core',
}

const lateralRaises: ExerciseDefinition = {
  id: 'lateral-raises',
  name: 'Lateral Raises',
  equipment: ['kettlebell'],
  defaultSets: 3,
  repRange: [12, 15],
  hasProgressiveOverload: false,
  notes: 'Light weight, squeeze',
}

const tricepPushdowns: ExerciseDefinition = {
  id: 'tricep-pushdowns',
  name: 'Tricep Pushdowns (Tonal)',
  equipment: ['tonal'],
  defaultSets: 3,
  repRange: [12, 15],
  hasProgressiveOverload: false,
  notes: 'Full extension',
}

const dipsOrCGPushups: ExerciseDefinition = {
  id: 'dips-cgpushups',
  name: 'Dips or Close-Grip Push-Ups',
  equipment: ['bodyweight'],
  defaultSets: 2,
  repRange: [1, 99],
  hasProgressiveOverload: false,
  notes: 'To failure — bodyweight',
}

const latPulldown: ExerciseDefinition = {
  id: 'lat-pulldown',
  name: 'Lat Pulldown (Tonal)',
  equipment: ['tonal'],
  defaultSets: 4,
  repRange: [8, 12],
  hasProgressiveOverload: true,
  notes: 'Full ROM, drive elbows down',
}

const seatedCableRow: ExerciseDefinition = {
  id: 'cable-row',
  name: 'Seated Cable Row (Tonal)',
  equipment: ['tonal'],
  defaultSets: 3,
  repRange: [10, 12],
  hasProgressiveOverload: true,
  notes: 'Squeeze scapulae',
}

const facePulls: ExerciseDefinition = {
  id: 'face-pulls',
  name: 'Face Pulls',
  equipment: ['tonal'],
  defaultSets: 3,
  repRange: [15, 20],
  hasProgressiveOverload: false,
  notes: 'Light, rear delt focus',
}

const bicepCurls: ExerciseDefinition = {
  id: 'bicep-curls',
  name: 'Bicep Curls (Kettlebell)',
  equipment: ['kettlebell'],
  defaultSets: 3,
  repRange: [10, 12],
  hasProgressiveOverload: false,
  notes: 'No swinging',
}

const hammerCurls: ExerciseDefinition = {
  id: 'hammer-curls',
  name: 'Hammer Curls',
  equipment: ['kettlebell'],
  defaultSets: 3,
  repRange: [10, 12],
  hasProgressiveOverload: false,
  notes: 'Controlled eccentric',
}

const reverseFlyes: ExerciseDefinition = {
  id: 'reverse-flyes',
  name: 'Reverse Flyes',
  equipment: ['kettlebell'],
  defaultSets: 2,
  repRange: [12, 15],
  hasProgressiveOverload: false,
  notes: 'Posture focus',
}

const gobletSquat: ExerciseDefinition = {
  id: 'goblet-squat',
  name: 'Goblet Squats (Kettlebell)',
  equipment: ['kettlebell'],
  defaultSets: 4,
  repRange: [10, 12],
  hasProgressiveOverload: true,
  notes: 'Below parallel',
}

const rdl: ExerciseDefinition = {
  id: 'rdl',
  name: 'Romanian Deadlift (Tonal)',
  equipment: ['tonal'],
  defaultSets: 3,
  repRange: [8, 10],
  hasProgressiveOverload: true,
  notes: 'Hinge pattern',
}

const walkingLunges: ExerciseDefinition = {
  id: 'walking-lunges',
  name: 'Walking Lunges',
  equipment: ['kettlebell'],
  defaultSets: 3,
  repRange: [12, 12],
  hasProgressiveOverload: false,
  notes: '12 per leg — bodyweight or KB',
}

const legCurls: ExerciseDefinition = {
  id: 'leg-curls',
  name: 'Leg Curls (Tonal)',
  equipment: ['tonal'],
  defaultSets: 3,
  repRange: [12, 15],
  hasProgressiveOverload: false,
  notes: 'Slow eccentric',
}

const calfRaises: ExerciseDefinition = {
  id: 'calf-raises',
  name: 'Calf Raises',
  equipment: ['bodyweight'],
  defaultSets: 3,
  repRange: [15, 20],
  hasProgressiveOverload: false,
  notes: '2-sec pause at top',
}

const plankHold: ExerciseDefinition = {
  id: 'plank-hold',
  name: 'Plank Hold',
  equipment: ['bodyweight'],
  defaultSets: 3,
  repRange: [45, 60],
  repUnit: 'seconds',
  hasProgressiveOverload: false,
  notes: 'Head to heels straight',
}

const cableWoodchops: ExerciseDefinition = {
  id: 'cable-woodchops',
  name: 'Cable Woodchops',
  equipment: ['tonal'],
  defaultSets: 2,
  repRange: [12, 12],
  hasProgressiveOverload: false,
  notes: '12 per side — rotation control',
}

const arnoldPress: ExerciseDefinition = {
  id: 'arnold-press',
  name: 'Arnold Press (Kettlebell)',
  equipment: ['kettlebell'],
  defaultSets: 4,
  repRange: [8, 10],
  hasProgressiveOverload: false,
  notes: 'Full rotation',
}

const weightedPushups: ExerciseDefinition = {
  id: 'weighted-pushups',
  name: 'Push-Ups (Weighted Vest)',
  equipment: ['bodyweight'],
  defaultSets: 3,
  repRange: [15, 20],
  hasProgressiveOverload: false,
  notes: 'Chest to floor',
}

const cableFrontRaise: ExerciseDefinition = {
  id: 'cable-front-raise',
  name: 'Cable Front Raise (Tonal)',
  equipment: ['tonal'],
  defaultSets: 3,
  repRange: [12, 15],
  hasProgressiveOverload: false,
  notes: 'No momentum',
}

const ohTricepExt: ExerciseDefinition = {
  id: 'oh-tricep-ext',
  name: 'Overhead Tricep Extension',
  equipment: ['kettlebell'],
  defaultSets: 3,
  repRange: [10, 12],
  hasProgressiveOverload: false,
  notes: 'Full stretch',
}

const treadmillHIIT: ExerciseDefinition = {
  id: 'treadmill-hiit',
  name: 'Treadmill HIIT',
  equipment: ['treadmill'],
  defaultSets: 1,
  repRange: [15, 15],
  repUnit: 'minutes',
  hasProgressiveOverload: false,
  notes: '30s sprint / 60s walk',
}

const deadlift: ExerciseDefinition = {
  id: 'deadlift',
  name: 'Deadlift (Tonal/KB)',
  equipment: ['tonal', 'kettlebell'],
  defaultSets: 4,
  repRange: [6, 8],
  hasProgressiveOverload: true,
  notes: 'Heavy, neutral spine',
}

const singleArmRow: ExerciseDefinition = {
  id: 'single-arm-row',
  name: 'Single-Arm Row (KB)',
  equipment: ['kettlebell'],
  defaultSets: 3,
  repRange: [10, 12],
  hasProgressiveOverload: false,
  notes: '10-12 per arm — anti-rotation',
}

const chinUps: ExerciseDefinition = {
  id: 'chin-ups',
  name: 'Chin-Ups or Assisted',
  equipment: ['bodyweight'],
  defaultSets: 3,
  repRange: [6, 10],
  hasProgressiveOverload: false,
  notes: 'Controlled descent',
}

const preacherCurl: ExerciseDefinition = {
  id: 'preacher-curl',
  name: 'Preacher Curl (Tonal)',
  equipment: ['tonal'],
  defaultSets: 3,
  repRange: [10, 12],
  hasProgressiveOverload: false,
  notes: 'Squeeze at top',
}

const bikeSteadyState: ExerciseDefinition = {
  id: 'bike-steady-state',
  name: 'Bike Steady State',
  equipment: ['bike'],
  defaultSets: 1,
  repRange: [20, 20],
  repUnit: 'minutes',
  hasProgressiveOverload: false,
  notes: 'Zone 2 HR',
}

const lightTreadmill: ExerciseDefinition = {
  id: 'light-treadmill',
  name: 'Light Treadmill Walk',
  equipment: ['treadmill'],
  defaultSets: 1,
  repRange: [20, 20],
  repUnit: 'minutes',
  hasProgressiveOverload: false,
  notes: '2.5-3.5 mph',
}

const foamRolling: ExerciseDefinition = {
  id: 'foam-rolling',
  name: 'Foam Rolling / Stretching',
  equipment: ['bodyweight'],
  defaultSets: 1,
  repRange: [15, 15],
  repUnit: 'minutes',
  hasProgressiveOverload: false,
  notes: 'All major groups',
}

const yogaFlow: ExerciseDefinition = {
  id: 'yoga-flow',
  name: 'Yoga Flow or Mobility',
  equipment: ['bodyweight'],
  defaultSets: 1,
  repRange: [15, 15],
  repUnit: 'minutes',
  hasProgressiveOverload: false,
  notes: 'Hip openers, thoracic spine',
}

// ─── Weekly Schedule ──────────────────────────────────────────────────────────

export const WORKOUT_SCHEDULE: WorkoutDay[] = [
  {
    day: 'monday',
    label: 'PUSH',
    focusLabel: 'Chest, Shoulders, Triceps',
    exercises: [chestPress, inclineDBPress, ohPress, lateralRaises, tricepPushdowns, dipsOrCGPushups],
    includesCardio: false,
    isRest: false,
  },
  {
    day: 'tuesday',
    label: 'PULL',
    focusLabel: 'Back, Biceps, Rear Delts',
    exercises: [latPulldown, seatedCableRow, facePulls, bicepCurls, hammerCurls, reverseFlyes],
    includesCardio: false,
    isRest: false,
  },
  {
    day: 'wednesday',
    label: 'LEGS + Core',
    focusLabel: 'Quads, Hamstrings, Glutes, Core',
    exercises: [gobletSquat, rdl, walkingLunges, legCurls, calfRaises, plankHold, cableWoodchops],
    includesCardio: false,
    isRest: false,
  },
  {
    day: 'thursday',
    label: 'PUSH (Shoulder Focus)',
    focusLabel: 'Shoulders, Triceps + Cardio',
    exercises: [arnoldPress, weightedPushups, cableFrontRaise, ohTricepExt, treadmillHIIT],
    includesCardio: true,
    isRest: false,
  },
  {
    day: 'friday',
    label: 'PULL (Back Focus)',
    focusLabel: 'Back, Biceps + Cardio',
    exercises: [deadlift, singleArmRow, chinUps, preacherCurl, bikeSteadyState],
    includesCardio: true,
    isRest: false,
  },
  {
    day: 'saturday',
    label: 'Active Recovery',
    focusLabel: 'Light Cardio + Mobility',
    exercises: [lightTreadmill, foamRolling, yogaFlow],
    includesCardio: true,
    isRest: false,
  },
  {
    day: 'sunday',
    label: 'REST',
    focusLabel: 'Rest & Recover',
    exercises: [],
    includesCardio: false,
    isRest: true,
  },
]

// ─── Phase Configurations ─────────────────────────────────────────────────────

export const PHASE_CONFIGS: PhaseConfig[] = [
  {
    phase: 'foundation',
    weeks: [1, 4],
    label: 'Foundation',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    compoundRepRange: [10, 12],
    isolationRepRange: [12, 15],
    intensityMultiplier: 1.0,
    description: 'Build base strength, establish movement patterns, create habits. Moderate weight, higher reps.',
  },
  {
    phase: 'growth',
    weeks: [5, 8],
    label: 'Growth',
    color: 'text-accent',
    bgColor: 'bg-accent/20',
    compoundRepRange: [8, 10],
    isolationRepRange: [10, 12],
    intensityMultiplier: 1.0,
    description: 'Increase weight 5-10% every 2 weeks. Lower rep ranges on compounds. Volume increases.',
  },
  {
    phase: 'peak',
    weeks: [9, 11],
    label: 'Peak',
    color: 'text-red-400',
    bgColor: 'bg-red-400/20',
    compoundRepRange: [6, 8],
    isolationRepRange: [8, 12],
    intensityMultiplier: 1.0,
    description: 'Heavy compounds. Push your limits while maintaining form.',
  },
  {
    phase: 'deload',
    weeks: [12, 12],
    label: 'Deload',
    color: 'text-green-400',
    bgColor: 'bg-green-400/20',
    compoundRepRange: [12, 15],
    isolationRepRange: [15, 20],
    intensityMultiplier: 0.6,
    description: 'Back off to 60% intensity with higher reps. Let your body recover and consolidate gains.',
  },
]

export function getPhaseForWeek(week: number): PhaseConfig {
  const phase = PHASE_CONFIGS.find((p) => week >= p.weeks[0] && week <= p.weeks[1])
  return phase ?? PHASE_CONFIGS[PHASE_CONFIGS.length - 1]
}

export function getWorkoutForDay(day: DayOfWeek): WorkoutDay {
  return WORKOUT_SCHEDULE.find((w) => w.day === day) ?? WORKOUT_SCHEDULE[6]
}

export type HabitCategory = 'spirit' | 'soul_mind' | 'soul_emotions' | 'soul_will'

// Legacy categories from before the Spirit→Soul→Body redesign — remapped on load
const LEGACY_MAP: Record<string, HabitCategory> = {
  spiritual: 'spirit',
  practical: 'soul_will',
  startup:   'soul_mind',
  kids:      'soul_emotions',
}

export function normalizeCategory(cat: string): HabitCategory {
  return (LEGACY_MAP[cat] ?? cat) as HabitCategory
}

export interface Habit {
  id: string
  name: string
  category: HabitCategory
  icon: string
  optional?: boolean
  weekdaysOnly?: boolean
}

export interface HouseChore {
  dayOfWeek: number
  name: string
  icon: string
}

export const DEFAULT_HABITS: Habit[] = [
  // Spirit
  { id: 'morning-prayer',    name: 'Morning prayer',              category: 'spirit',         icon: '🙏' },
  { id: 'scripture',         name: 'Scripture / devotional',      category: 'spirit',         icon: '📖' },
  { id: 'evening-reflect',   name: 'Evening reflection',          category: 'spirit',         icon: '🌙' },

  // Soul — Mind
  { id: 'reading',           name: 'Reading',                     category: 'soul_mind',      icon: '📚' },
  { id: 'startup',           name: 'Startup — 1 focused hour',    category: 'soul_mind',      icon: '💡', weekdaysOnly: true },

  // Soul — Emotions
  { id: 'kids-time',         name: 'Quality time with kids',      category: 'soul_emotions',  icon: '👨‍👧‍👦' },
  { id: 'spouse',            name: 'Connect with spouse',         category: 'soul_emotions',  icon: '❤️' },

  // Soul — Will
  { id: 'make-bed',          name: 'Make bed',                    category: 'soul_will',      icon: '🛏️' },
  { id: 'cold-shower',       name: 'Cold shower',                 category: 'soul_will',      icon: '🚿' },
  { id: 'commitments-kept',  name: 'Commitments kept',            category: 'soul_will',      icon: '✅' },
]

export const HOUSE_CHORES: HouseChore[] = [
  { dayOfWeek: 0, name: 'Light tidy + reset for the week', icon: '✨' },
  { dayOfWeek: 1, name: 'Vacuum all floors',               icon: '🌀' },
  { dayOfWeek: 2, name: 'Clean bathrooms',                 icon: '🚿' },
  { dayOfWeek: 3, name: 'Kitchen deep clean',              icon: '🍳' },
  { dayOfWeek: 4, name: 'Laundry — wash, dry, fold',      icon: '👕' },
  { dayOfWeek: 5, name: 'Mop floors',                     icon: '🧹' },
  { dayOfWeek: 6, name: 'Yard / outdoor tidying',          icon: '🌿' },
]

export function getDailyChore(): HouseChore {
  return HOUSE_CHORES[new Date().getDay()]
}

export const CATEGORY_META: Record<HabitCategory, { label: string; sublabel: string; color: string; bg: string }> = {
  spirit:         { label: 'Spirit',    sublabel: 'The source',        color: 'text-indigo-300', bg: 'bg-indigo-400/10' },
  soul_mind:      { label: 'Mind',      sublabel: 'Soul — thinking',   color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  soul_emotions:  { label: 'Emotions',  sublabel: 'Soul — feeling',    color: 'text-pink-400',   bg: 'bg-pink-400/10'   },
  soul_will:      { label: 'Will',      sublabel: 'Soul — choosing',   color: 'text-accent',     bg: 'bg-accent/10'     },
}

export type HabitCategory = 'spiritual' | 'practical' | 'startup' | 'kids'

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
  // Spiritual
  { id: 'morning-prayer',  name: 'Morning prayer',                  category: 'spiritual', icon: '🙏' },
  { id: 'gratitude',       name: 'Gratitude journal (3 things)',     category: 'spiritual', icon: '📓' },
  { id: 'scripture',       name: 'Scripture / devotional reading',   category: 'spiritual', icon: '📖', optional: true },

  // Practical
  { id: 'make-bed',        name: 'Make bed',                        category: 'practical', icon: '🛏️' },
  { id: 'cold-shower',     name: 'Cold shower',                     category: 'practical', icon: '🚿' },

  // Startup
  { id: 'startup',         name: 'Startup — 1 focused hour',        category: 'startup',   icon: '💡', weekdaysOnly: true },

  // Kids
  { id: 'kids-time',       name: 'Quality time with kids',          category: 'kids',      icon: '👨‍👧‍👦' },
]

// One house chore per day, rotating through the week
export const HOUSE_CHORES: HouseChore[] = [
  { dayOfWeek: 0, name: 'Light tidy + reset for the week',   icon: '✨' },
  { dayOfWeek: 1, name: 'Vacuum all floors',                  icon: '🌀' },
  { dayOfWeek: 2, name: 'Clean bathrooms',                    icon: '🚿' },
  { dayOfWeek: 3, name: 'Kitchen deep clean',                 icon: '🍳' },
  { dayOfWeek: 4, name: 'Laundry — wash, dry, fold',         icon: '👕' },
  { dayOfWeek: 5, name: 'Mop floors',                        icon: '🧹' },
  { dayOfWeek: 6, name: 'Yard / outdoor tidying',            icon: '🌿' },
]

export function getDailyChore(): HouseChore {
  return HOUSE_CHORES[new Date().getDay()]
}

export const CATEGORY_META: Record<HabitCategory, { label: string; color: string; bg: string }> = {
  spiritual: { label: 'Spiritual',  color: 'text-blue-300',   bg: 'bg-blue-400/10'  },
  practical: { label: 'Practical',  color: 'text-accent',     bg: 'bg-accent/10'    },
  startup:   { label: 'Startup',    color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  kids:      { label: 'Kids',       color: 'text-pink-400',   bg: 'bg-pink-400/10'  },
}

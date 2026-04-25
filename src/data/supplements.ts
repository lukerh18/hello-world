export interface Supplement {
  id: string
  name: string
  dose: string
  timeBlock: 'morning' | 'post-workout' | 'evening'
  note?: string
}

// Update doses/brands to match your exact products
export const SUPPLEMENTS: Supplement[] = [
  // ─── Morning (with breakfast) ─────────────────────────────────────────────────
  { id: 'vitamin-d3',   name: 'Vitamin D3',   dose: '2000 IU',  timeBlock: 'morning',      note: 'With breakfast' },
  { id: 'fish-oil',     name: 'Fish Oil',      dose: '1g',       timeBlock: 'morning',      note: 'With breakfast' },
  { id: 'multivitamin', name: 'Multivitamin',  dose: '1 tablet', timeBlock: 'morning',      note: 'With breakfast' },
  // ─── Post-workout ─────────────────────────────────────────────────────────────
  { id: 'creatine',     name: 'Creatine',      dose: '5g',       timeBlock: 'post-workout', note: 'After workout' },
  // ─── Evening (before bed) ─────────────────────────────────────────────────────
  { id: 'magnesium',    name: 'Magnesium',     dose: '400mg',    timeBlock: 'evening',      note: 'Before bed' },
  { id: 'thiamine',     name: 'Thiamine B1',   dose: '100mg',    timeBlock: 'evening',      note: 'Before bed' },
  { id: 'ashwagandha',  name: 'Ashwagandha',   dose: '600mg',    timeBlock: 'evening',      note: 'Before bed' },
  { id: 'aloe-vera',    name: 'Aloe Vera',     dose: '2 tbsp',   timeBlock: 'evening',      note: 'Before bed' },
]

export const MORNING_SUPPLEMENTS      = SUPPLEMENTS.filter((s) => s.timeBlock === 'morning')
export const POST_WORKOUT_SUPPLEMENTS = SUPPLEMENTS.filter((s) => s.timeBlock === 'post-workout')
export const EVENING_SUPPLEMENTS      = SUPPLEMENTS.filter((s) => s.timeBlock === 'evening')

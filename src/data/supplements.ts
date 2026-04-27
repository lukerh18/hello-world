export type SupplementTimeBlock = 'morning' | 'pre-workout' | 'post-workout' | 'afternoon' | 'evening'

export interface Supplement {
  id: string
  name: string
  dose: string
  timeBlock: SupplementTimeBlock
  note?: string
}

export const SUPPLEMENTS: Supplement[] = [
  // ─── Morning (5:30 AM → 7:30 AM) ─────────────────────────────────────────────
  { id: 'zoloft',       name: 'Zoloft',          dose: '50 mg',          timeBlock: 'morning',      note: '5:30 AM — first, water only, before food or fiber' },
  { id: 'omega-3',      name: 'Omega-3',          dose: '2 softgels',     timeBlock: 'morning',      note: '7:30 AM w/ breakfast — fat needed for absorption' },
  { id: 'vitamin-d3',   name: 'Vitamin D3 + K2',  dose: '4,000 IU',      timeBlock: 'morning',      note: '7:30 AM w/ breakfast — fat-soluble' },
  { id: 'multivitamin', name: 'Multivitamin',      dose: '1 tablet',      timeBlock: 'morning',      note: '7:30 AM — B vitamins work best taken in the morning' },
  // ─── Pre-Workout (9:15 AM) ────────────────────────────────────────────────────
  { id: 'citrulline',   name: 'Citrulline Malate', dose: '6–8 g',         timeBlock: 'pre-workout',  note: '30–45 min before gym — pump + reduce fatigue' },
  { id: 'electrolytes', name: 'Electrolytes',       dose: 'per label',     timeBlock: 'pre-workout',  note: 'Mix with citrulline in 16 oz water' },
  // ─── Post-Workout (11:00 AM) ──────────────────────────────────────────────────
  { id: 'creatine',     name: 'Creatine',           dose: '5 g',           timeBlock: 'post-workout', note: 'Mix into post-workout shake' },
  // ─── Afternoon — Pre-Lunch (12:00 PM) ────────────────────────────────────────
  { id: 'psyllium-am',  name: 'Psyllium Husk',      dose: '1 tbsp in 12 oz water', timeBlock: 'afternoon', note: '30 min before lunch — LDL + appetite control' },
  // ─── Evening ─────────────────────────────────────────────────────────────────
  { id: 'psyllium-pm',  name: 'Psyllium Husk',      dose: '1 tbsp in 12 oz water', timeBlock: 'evening',   note: '5:30 PM, 30 min before dinner — follow with 8 oz water' },
  { id: 'ashwagandha',  name: 'Ashwagandha',         dose: '600 mg',        timeBlock: 'evening',      note: 'Cortisol + stress support' },
  { id: 'magnesium',    name: 'Magnesium Glycinate',  dose: '300–400 mg',   timeBlock: 'evening',      note: '9:30 PM — calming, not sedating; supports 10 PM target' },
]

export const MORNING_SUPPLEMENTS      = SUPPLEMENTS.filter((s) => s.timeBlock === 'morning')
export const PRE_WORKOUT_SUPPLEMENTS  = SUPPLEMENTS.filter((s) => s.timeBlock === 'pre-workout')
export const POST_WORKOUT_SUPPLEMENTS = SUPPLEMENTS.filter((s) => s.timeBlock === 'post-workout')
export const AFTERNOON_SUPPLEMENTS    = SUPPLEMENTS.filter((s) => s.timeBlock === 'afternoon')
export const EVENING_SUPPLEMENTS      = SUPPLEMENTS.filter((s) => s.timeBlock === 'evening')

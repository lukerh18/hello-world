export interface Supplement {
  id: string
  name: string
  dose: string
  timeBlock: 'morning' | 'evening'
  note?: string
}

// Update this list with your exact supplement schedule
export const SUPPLEMENTS: Supplement[] = [
  { id: 'creatine',     name: 'Creatine',     dose: '5g',       timeBlock: 'morning', note: 'Mix with water or juice' },
  { id: 'vitamin-d3',  name: 'Vitamin D3',   dose: '2000 IU',  timeBlock: 'morning', note: 'With breakfast' },
  { id: 'fish-oil',    name: 'Fish Oil',     dose: '1g',       timeBlock: 'morning', note: 'With breakfast' },
  { id: 'multivitamin',name: 'Multivitamin', dose: '1 tablet', timeBlock: 'morning', note: 'With breakfast' },
  { id: 'magnesium',   name: 'Magnesium',    dose: '400mg',    timeBlock: 'evening', note: '30 min before bed' },
]

export const MORNING_SUPPLEMENTS = SUPPLEMENTS.filter((s) => s.timeBlock === 'morning')
export const EVENING_SUPPLEMENTS = SUPPLEMENTS.filter((s) => s.timeBlock === 'evening')

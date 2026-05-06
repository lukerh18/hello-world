export interface FasterStage {
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7
  label: string
  summary: string
  signals: string[]
}

export const FASTER_STAGES: FasterStage[] = [
  {
    level: 1,
    label: 'Restoration',
    summary: 'Accepting life with trust, grace, honesty, and healthy accountability.',
    signals: [
      'No current secrets',
      'Working to resolve problems',
      'Identifying fears and feelings',
      'Keeping commitments to God, family, and people',
      'Being open and honest',
    ],
  },
  {
    level: 2,
    label: 'Forgetting Priorities',
    summary: 'Moving away from trust, support, and what matters most.',
    signals: [
      'Denial or flight',
      'Secrets and image management',
      'Avoiding support and accountability',
      'Isolating and superficial conversations',
      'Breaking commitments and neglecting family',
    ],
  },
  {
    level: 3,
    label: 'Anxiety',
    summary: 'Undefined fear rises and starts driving choices.',
    signals: [
      'Worry and fear',
      'Replaying negative thoughts',
      'Perfectionism and mind reading',
      'Trouble concentrating or sleeping',
      'Creating drama or gossip',
    ],
  },
  {
    level: 4,
    label: 'Speeding Up',
    summary: 'Trying to outrun anxiety with busyness and overdrive.',
    signals: [
      'Always in a hurry and feeling driven',
      'Cannot relax or turn off thoughts',
      'Skipping meals or binge eating',
      'Irritable mood swings',
      'Too much caffeine and over-exercising',
    ],
  },
  {
    level: 5,
    label: 'Ticked Off',
    summary: 'Adrenaline-fueled anger, blame, and conflict.',
    signals: [
      'Arguing and defensive posture',
      'All-or-nothing thinking',
      'Overreacting and resentment',
      'Pushing people away',
      'Needing to be right',
    ],
  },
  {
    level: 6,
    label: 'Exhausted',
    summary: 'Adrenaline drops and emotional/physical depletion sets in.',
    signals: [
      'Overwhelmed or hopeless',
      'Sleep and focus collapse',
      'Numb, tired, and isolated',
      'Constant cravings for old coping behaviors',
      'Survival mode',
    ],
  },
  {
    level: 7,
    label: 'Relapse',
    summary: 'Returning to old coping patterns and reinforcing shame.',
    signals: [
      'Giving up and giving in',
      'Out of control patterns',
      'Lying to self or others',
      'Escaping through old behaviors',
      'Feeling alone and condemned',
    ],
  },
]

export function getFasterStage(level: number | null): FasterStage | null {
  if (level === null) return null
  return FASTER_STAGES.find((stage) => stage.level === level) ?? null
}

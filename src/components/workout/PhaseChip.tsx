import type { PhaseConfig } from '../../types'

interface PhaseChipProps {
  phase: PhaseConfig
  week: number
  size?: 'sm' | 'md'
}

export function PhaseChip({ phase, week, size = 'md' }: PhaseChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${phase.bgColor} ${phase.color} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      }`}
    >
      Week {week} · {phase.label}
    </span>
  )
}

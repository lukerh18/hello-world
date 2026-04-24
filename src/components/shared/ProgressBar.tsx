interface ProgressBarProps {
  value: number
  max: number
  color?: string
  height?: string
  showLabel?: boolean
  label?: string
}

export function ProgressBar({
  value,
  max,
  color = 'bg-accent',
  height = 'h-2',
  showLabel = false,
  label,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between mb-1 text-xs text-slate-400">
          {label && <span>{label}</span>}
          {showLabel && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full bg-surface-700 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface TotalMarkProps {
  size?: number
  color?: string
  bg?: string
  className?: string
}

export function TotalMark({ size = 96, color = 'currentColor', bg = 'transparent', className }: TotalMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
      className={className}
    >
      {bg !== 'transparent' && <rect width="24" height="24" rx="5.4" fill={bg} />}
      {/* horizontal bar */}
      <rect x="4" y="6.5" width="16" height="2.4" rx="0.4" fill={color} />
      {/* stem */}
      <rect x="10.8" y="6.5" width="2.4" height="13" rx="0.4" fill={color} />
      {/* base tick — reads as a measure / baseline */}
      <rect x="8.4" y="17.3" width="7.2" height="2.2" rx="0.4" fill={color} />
    </svg>
  )
}

interface TotalWordmarkProps {
  size?: number
  color?: string
  className?: string
}

export function TotalWordmark({ size = 56, color = 'currentColor', className }: TotalWordmarkProps) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: size * 0.18,
        color,
        fontFamily: 'var(--sans)',
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.04em',
      }}
    >
      <TotalMark size={size * 0.92} color={color} />
      <span>total</span>
    </div>
  )
}

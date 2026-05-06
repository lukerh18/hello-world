import type { ReactNode } from 'react'

interface TagProps {
  children: ReactNode
  variant?: 'default' | 'accent' | 'muted'
  className?: string
}

const variantStyles: Record<NonNullable<TagProps['variant']>, string> = {
  default: 'bg-surface-800 text-text-primary border border-border-subtle',
  accent:  'bg-accent/15 text-accent-light border border-accent/40',
  muted:   'bg-surface-700 text-text-muted border border-border-subtle',
}

export function Tag({ children, variant = 'default', className = '' }: TagProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-3 py-1 rounded-pill text-xs font-medium font-mono tracking-wide',
        variantStyles[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}

import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: ReactNode
}

const variantClasses = {
  primary:     'bg-accent text-surface-950 hover:bg-accent-light shadow-card-inset active:scale-[0.98]',
  secondary:   'bg-surface-800 border border-border-subtle text-text-primary hover:bg-surface-700 shadow-card-inset active:scale-[0.98]',
  ghost:       'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-700 active:scale-[0.98]',
  danger:      'bg-transparent text-danger border border-danger hover:bg-danger/10 active:scale-95',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-panel',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'focus-rivian font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

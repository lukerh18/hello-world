import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  unit?: string
}

export function Input({ label, error, unit, className = '', id, inputMode: inputModeProp, type, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const inputMode = inputModeProp ?? (type === 'number' ? 'decimal' : undefined)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium font-mono text-text-muted uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={type}
          inputMode={inputMode}
          className={[
            'focus-rivian w-full bg-surface-700 border border-border-subtle rounded-xl px-3 py-2 text-text-primary shadow-card-inset',
            'text-sm focus:outline-none focus:border-accent',
            'placeholder:text-text-muted',
            unit ? 'pr-10' : '',
            error ? 'border-danger' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

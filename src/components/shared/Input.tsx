import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  unit?: string
}

export function Input({ label, error, unit, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={[
            'w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-slate-100',
            'text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
            'placeholder:text-slate-500',
            unit ? 'pr-10' : '',
            error ? 'border-danger' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

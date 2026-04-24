import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-slate-600 mb-3 text-5xl">{icon}</div>}
      <p className="text-slate-300 font-semibold mb-1">{title}</p>
      {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}

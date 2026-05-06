import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="panel-surface flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-800">
      {icon && <div className="text-text-muted mb-3 text-5xl">{icon}</div>}
      <p className="text-text-primary font-semibold mb-1">{title}</p>
      {description && <p className="text-sm text-text-secondary mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}

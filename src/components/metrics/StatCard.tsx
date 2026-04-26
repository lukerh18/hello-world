import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  subtext?: string
  icon?: ReactNode
  color?: string
}

export function StatCard({ label, value, unit, subtext, icon, color = 'text-slate-100' }: StatCardProps) {
  return (
    <div className="bg-surface-800 rounded-2xl p-4 border border-surface-700 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        {icon && <span className="text-slate-600">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        {value}
        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </p>
      {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
    </div>
  )
}

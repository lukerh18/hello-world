import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { WeightEntry } from '../../types'

interface WeightChartProps {
  data: WeightEntry[]
  goalWeight: number
}

export function WeightChart({ data, goalWeight }: WeightChartProps) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-44 text-sm text-slate-500">
        Log at least 2 weigh-ins to see your chart
      </div>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  const weights = data.map((d) => d.weight)
  const min = Math.floor(Math.min(...weights, goalWeight)) - 1
  const max = Math.ceil(Math.max(...weights)) + 1

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis domain={[min, max]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#f1f5f9' }}
          formatter={(v: number) => [`${v} lbs`, 'Weight']}
        />
        <ReferenceLine
          y={goalWeight}
          stroke="#22c55e"
          strokeDasharray="5 3"
          label={{ value: `Goal ${goalWeight}`, fill: '#22c55e', fontSize: 10, position: 'right' }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ fill: '#f97316', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

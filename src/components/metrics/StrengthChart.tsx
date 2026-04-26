import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface StrengthDataPoint {
  date: string
  weight: number
  label: string
}

interface StrengthChartProps {
  data: StrengthDataPoint[]
  exerciseName: string
}

export function StrengthChart({ data, exerciseName }: StrengthChartProps) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-44 text-sm text-slate-500">
        Complete at least 2 sessions to see progress
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2 text-center">{exerciseName} — Max Weight (lbs)</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#f1f5f9' }}
            formatter={(v: number) => [`${v} lbs`, 'Max weight']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ fill: '#7c3aed', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface MacroRingProps {
  calories: number
  targetCalories: number
  protein: number
  targetProtein: number
  carbs: number
  targetCarbs: number
  fat: number
  targetFat: number
  size?: number
}

function arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export function MacroRing({
  calories,
  targetCalories,
  protein,
  targetProtein,
  carbs,
  targetCarbs,
  fat,
  targetFat,
  size = 140,
}: MacroRingProps) {
  const cx = size / 2
  const cy = size / 2
  const strokeWidth = 10
  const gap = 4

  const proteinR = cx - strokeWidth / 2 - 2
  const carbsR = proteinR - strokeWidth - gap
  const fatR = carbsR - strokeWidth - gap

  const pctOf = (v: number, t: number) => Math.min(100, t > 0 ? (v / t) * 100 : 0)
  const toAngle = (pct: number) => (pct / 100) * 355

  const proteinAngle = toAngle(pctOf(protein, targetProtein))
  const carbsAngle = toAngle(pctOf(carbs, targetCarbs))
  const fatAngle = toAngle(pctOf(fat, targetFat))

  const calPct = Math.round(pctOf(calories, targetCalories))

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Track rings */}
          <circle cx={cx} cy={cy} r={proteinR} fill="none" stroke="#334155" strokeWidth={strokeWidth} />
          <circle cx={cx} cy={cy} r={carbsR} fill="none" stroke="#334155" strokeWidth={strokeWidth} />
          <circle cx={cx} cy={cy} r={fatR} fill="none" stroke="#334155" strokeWidth={strokeWidth} />

          {/* Protein arc — blue */}
          {proteinAngle > 0 && (
            <path
              d={arc(cx, cy, proteinR, 0, proteinAngle)}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
          {/* Carbs arc — orange */}
          {carbsAngle > 0 && (
            <path
              d={arc(cx, cy, carbsR, 0, carbsAngle)}
              fill="none"
              stroke="#f97316"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
          {/* Fat arc — yellow */}
          {fatAngle > 0 && (
            <path
              d={arc(cx, cy, fatR, 0, fatAngle)}
              fill="none"
              stroke="#eab308"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-100">{calPct}%</span>
          <span className="text-[10px] text-slate-500">of goal</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 text-xs">
        <MacroItem color="bg-blue-400" label="Protein" value={protein} target={targetProtein} unit="g" />
        <MacroItem color="bg-accent" label="Carbs" value={carbs} target={targetCarbs} unit="g" />
        <MacroItem color="bg-warn" label="Fat" value={fat} target={targetFat} unit="g" />
        <div className="pt-1 border-t border-surface-700">
          <span className="text-slate-400">{calories}</span>
          <span className="text-slate-600"> / {targetCalories} kcal</span>
        </div>
      </div>
    </div>
  )
}

function MacroItem({
  color,
  label,
  value,
  target,
  unit,
}: {
  color: string
  label: string
  value: number
  target: number
  unit: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
      <span className="text-slate-400 w-14">{label}</span>
      <span className="text-slate-200 font-semibold">
        {Math.round(value)}
        <span className="text-slate-500 font-normal">/{target}{unit}</span>
      </span>
    </div>
  )
}

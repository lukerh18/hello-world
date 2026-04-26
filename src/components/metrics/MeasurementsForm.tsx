import { useState } from 'react'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import type { BodyMeasurements } from '../../types'

interface MeasurementsFormProps {
  onSave: (m: BodyMeasurements) => void
  latest?: BodyMeasurements
}

export function MeasurementsForm({ onSave, latest }: MeasurementsFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [chest, setChest] = useState(latest?.chest?.toString() ?? '')
  const [waist, setWaist] = useState(latest?.waist?.toString() ?? '')
  const [arms, setArms] = useState(latest?.arms?.toString() ?? '')
  const [thighs, setThighs] = useState(latest?.thighs?.toString() ?? '')
  const [bodyFat, setBodyFat] = useState(latest?.bodyFat?.toString() ?? '')

  const handleSave = () => {
    onSave({
      date,
      chest: chest ? parseFloat(chest) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      arms: arms ? parseFloat(arms) : undefined,
      thighs: thighs ? parseFloat(thighs) : undefined,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
    })
  }

  return (
    <div className="space-y-3">
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Chest" type="number" unit="in" value={chest} onChange={(e) => setChest(e.target.value)} step={0.25} />
        <Input label="Waist" type="number" unit="in" value={waist} onChange={(e) => setWaist(e.target.value)} step={0.25} />
        <Input label="Arms" type="number" unit="in" value={arms} onChange={(e) => setArms(e.target.value)} step={0.25} />
        <Input label="Thighs" type="number" unit="in" value={thighs} onChange={(e) => setThighs(e.target.value)} step={0.25} />
        <Input label="Body Fat" type="number" unit="%" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} step={0.1} />
      </div>
      <Button fullWidth onClick={handleSave}>Save Measurements</Button>
    </div>
  )
}

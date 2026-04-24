import { useState } from 'react'
import { Modal } from '../shared/Modal'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import type { FoodItem, Meal } from '../../types'

interface AddFoodModalProps {
  open: boolean
  onClose: () => void
  meals: Meal[]
  onAdd: (mealId: string, food: FoodItem) => void
}

export function AddFoodModal({ open, onClose, meals, onAdd }: AddFoodModalProps) {
  const [mealId, setMealId] = useState(meals[0]?.id ?? '')
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const reset = () => {
    setName('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
  }

  const handleSubmit = () => {
    if (!name || !calories) return
    const food: FoodItem = {
      id: crypto.randomUUID(),
      name,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    }
    onAdd(mealId, food)
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Add Food">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">
            Meal
          </label>
          <select
            value={mealId}
            onChange={(e) => setMealId(e.target.value)}
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent"
          >
            {meals.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Food name"
          placeholder="e.g. Chicken breast"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Calories" type="number" min={0} unit="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} />
          <Input label="Protein" type="number" min={0} unit="g" value={protein} onChange={(e) => setProtein(e.target.value)} />
          <Input label="Carbs" type="number" min={0} unit="g" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          <Input label="Fat" type="number" min={0} unit="g" value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>

        <Button fullWidth onClick={handleSubmit} disabled={!name || !calories}>
          Add Food
        </Button>
      </div>
    </Modal>
  )
}

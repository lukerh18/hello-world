import { useRef, useState } from 'react'
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { FoodItem } from '../../types'

interface ParsedFood {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string
}

type MealId = 'breakfast' | 'lunch' | 'snack' | 'dinner'

interface PhotoAnalyzerProps {
  apiKey: string
  onFoodParsed: (food: Omit<FoodItem, 'id'>, mealId: MealId) => void
}

function resizeImage(file: File, maxPx = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function PhotoAnalyzer({ apiKey, onFoodParsed }: PhotoAnalyzerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedFood | null>(null)
  const [selectedMeal, setSelectedMeal] = useState<MealId>('lunch')

  const meals: { value: MealId; label: string }[] = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'snack', label: 'Snack' },
    { value: 'dinner', label: 'Dinner' },
  ]

  const handleFile = async (file: File) => {
    setError(null)
    setParsed(null)
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    try {
      const base64 = await resizeImage(file)
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
                {
                  type: 'text',
                  text: 'Identify this food. Respond ONLY with valid JSON, no markdown: {"name":"...","calories":0,"protein":0,"carbs":0,"fat":0,"serving":"..."}',
                },
              ],
            },
          ],
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: { message?: string } }).error?.message ?? `API error ${res.status}`)
      }
      const data = await res.json()
      const text: string = data.content?.[0]?.text ?? ''
      const food: ParsedFood = JSON.parse(text)
      setParsed(food)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze photo')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!parsed) return
    onFoodParsed(
      {
        name: parsed.name,
        calories: parsed.calories,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
      },
      selectedMeal
    )
    setPreview(null)
    setParsed(null)
  }

  const handleDismiss = () => {
    setPreview(null)
    setParsed(null)
    setError(null)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-800 border border-surface-700 text-sm text-slate-300 hover:border-accent/50 transition-colors"
        title="Analyze food photo with AI"
      >
        <CameraIcon className="w-4 h-4 text-accent" />
        <span>Scan Food</span>
      </button>

      {(preview || loading || error) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="bg-surface-900 rounded-2xl border border-surface-700 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Food Scanner</h3>
              <button onClick={handleDismiss}>
                <XMarkIcon className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {preview && (
              <img
                src={preview}
                alt="Food preview"
                className="w-full h-40 object-cover rounded-xl"
              />
            )}

            {loading && (
              <p className="text-sm text-slate-400 text-center animate-pulse">Analyzing with AI...</p>
            )}

            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}

            {parsed && !loading && (
              <div className="space-y-3">
                <div className="bg-surface-800 rounded-xl p-3 space-y-2">
                  <p className="text-sm font-semibold text-slate-100">{parsed.name}</p>
                  <p className="text-xs text-slate-500">{parsed.serving}</p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-slate-400"><span className="text-slate-100 font-semibold">{parsed.calories}</span> kcal</span>
                    <span className="text-blue-400"><span className="font-semibold">{parsed.protein}g</span> P</span>
                    <span className="text-accent"><span className="font-semibold">{parsed.carbs}g</span> C</span>
                    <span className="text-warn"><span className="font-semibold">{parsed.fat}g</span> F</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Add to</label>
                  <div className="flex gap-2 flex-wrap">
                    {meals.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setSelectedMeal(m.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          selectedMeal === m.value
                            ? 'bg-accent text-white'
                            : 'bg-surface-700 text-slate-400'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold"
                >
                  Log to {meals.find((m) => m.value === selectedMeal)?.label}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

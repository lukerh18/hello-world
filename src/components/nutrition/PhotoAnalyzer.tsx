import { useRef, useState } from 'react'
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../../lib/supabase'
import type { FoodItem } from '../../types'

interface ParsedFood {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sugar?: number
  serving: string
}

type MealId = 'breakfast' | 'lunch' | 'snacks' | 'dinner'

interface PhotoAnalyzerProps {
  onFoodParsed: (food: Omit<FoodItem, 'id'>, mealId: MealId) => void
}

function resizeDataUrl(dataUrl: string, maxPx = 800): Promise<string> {
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
    img.src = dataUrl
  })
}

function resizeFile(file: File, maxPx = 800): Promise<string> {
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

export function PhotoAnalyzer({ onFoodParsed }: PhotoAnalyzerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedFood | null>(null)
  const [selectedMeal, setSelectedMeal] = useState<MealId>('lunch')

  const meals: { value: MealId; label: string }[] = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'snacks', label: 'Snack' },
    { value: 'dinner', label: 'Dinner' },
  ]

  const analyzeBase64 = async (base64: string, previewSrc: string) => {
    setError(null)
    setParsed(null)
    setPreview(previewSrc)
    setLoading(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('analyze-food-photo', {
        body: { base64 },
      })
      if (fnErr) throw new Error(fnErr.message)
      if (data?.error) throw new Error(data.error)
      setParsed(data as ParsedFood)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze photo')
    } finally {
      setLoading(false)
    }
  }

  const handleNativeCamera = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 85,
      })
      if (!photo.dataUrl) return
      const base64 = await resizeDataUrl(photo.dataUrl)
      await analyzeBase64(base64, photo.dataUrl)
    } catch (e) {
      // user cancelled — no-op
      if (e instanceof Error && e.message.toLowerCase().includes('cancel')) return
      setError(e instanceof Error ? e.message : 'Camera error')
    }
  }

  const handleWebFile = async (file: File) => {
    const previewSrc = URL.createObjectURL(file)
    const base64 = await resizeFile(file)
    await analyzeBase64(base64, previewSrc)
  }

  const handleScan = () => {
    if (Capacitor.isNativePlatform()) {
      handleNativeCamera()
    } else {
      inputRef.current?.click()
    }
  }

  const handleConfirm = () => {
    if (!parsed) return
    onFoodParsed(
      { name: parsed.name, calories: parsed.calories, protein: parsed.protein, carbs: parsed.carbs, fat: parsed.fat, ...(parsed.sugar != null ? { sugar: parsed.sugar } : {}) },
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
      {/* Web fallback — hidden on native */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleWebFile(file)
          e.target.value = ''
        }}
      />

      <button
        onClick={handleScan}
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
              <img src={preview} alt="Food preview" className="w-full h-40 object-cover rounded-xl" />
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
                    {parsed.sugar != null && <span className="text-orange-400"><span className="font-semibold">{parsed.sugar}g</span> Sug</span>}
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
                          selectedMeal === m.value ? 'bg-accent text-white' : 'bg-surface-700 text-slate-400'
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

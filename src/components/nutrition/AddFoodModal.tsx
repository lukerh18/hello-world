import { useState, useEffect, useRef } from 'react'
import { Modal } from '../shared/Modal'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { useStaples } from '../../hooks/useStaples'
import type { Staple } from '../../hooks/useStaples'
import { MEAL_PRESETS, getPresetsByCategory } from '../../data/mealLibrary'
import type { MealPreset } from '../../data/mealLibrary'
import type { FoodItem, Meal } from '../../types'
import { TrashIcon, MagnifyingGlassIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

interface AddFoodModalProps {
  open: boolean
  onClose: () => void
  meals: Meal[]
  onAdd: (mealId: string, food: FoodItem) => void
}

type Tab = 'ai' | 'presets' | 'staples' | 'search' | 'manual'

interface ParsedFood {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  note?: string
}

interface USDAFood {
  fdcId: number
  description: string
  foodNutrients: { nutrientId: number; value: number }[]
}

function getNutrient(food: USDAFood, id: number): number {
  return Math.round(food.foodNutrients.find((n) => n.nutrientId === id)?.value ?? 0)
}

function foodFromPreset(preset: MealPreset): Omit<FoodItem, 'id'> {
  return { name: preset.name, calories: preset.calories, protein: preset.protein, carbs: preset.carbs, fat: preset.fat }
}

function foodFromStaple(staple: Staple): Omit<FoodItem, 'id'> {
  return { name: `${staple.name} (${staple.servingSize})`, calories: staple.calories, protein: staple.protein, carbs: staple.carbs, fat: staple.fat }
}

const PRESET_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const

export function AddFoodModal({ open, onClose, meals, onAdd }: AddFoodModalProps) {
  const [tab, setTab] = useState<Tab>('ai')
  const [mealId, setMealId] = useState(meals[0]?.id ?? '')
  const { staples, addStaple, deleteStaple } = useStaples()

  // AI tab
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<ParsedFood | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Presets
  const [presetCategory, setPresetCategory] = useState<typeof PRESET_CATEGORIES[number]>('breakfast')

  // Staples - add form
  const [showAddStaple, setShowAddStaple] = useState(false)
  const [sName, setSName] = useState('')
  const [sServing, setSServing] = useState('')
  const [sCal, setSCal] = useState('')
  const [sProt, setSProt] = useState('')
  const [sCarbs, setSCarbs] = useState('')
  const [sFat, setSFat] = useState('')

  // USDA Search
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<USDAFood[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<USDAFood | null>(null)
  const [servingGrams, setServingGrams] = useState('100')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Manual
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  useEffect(() => {
    if (meals.length > 0 && !meals.find((m) => m.id === mealId)) {
      setMealId(meals[0].id)
    }
  }, [meals, mealId])

  // USDA debounced search
  useEffect(() => {
    if (query.trim().length < 2) { setSearchResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(query)}&pageSize=15&dataType=Foundation,SR%20Legacy`
        const res = await fetch(url)
        const data = await res.json()
        setSearchResults(data.foods ?? [])
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const resetManual = () => { setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('') }
  const resetStapleForm = () => { setSName(''); setSServing(''); setSCal(''); setSProt(''); setSCarbs(''); setSFat(''); setShowAddStaple(false) }
  const resetAi = () => { setAiText(''); setAiResult(null); setAiError(null) }

  const handleClose = () => {
    resetManual()
    resetStapleForm()
    resetAi()
    setQuery('')
    setSearchResults([])
    setSelectedFood(null)
    setServingGrams('100')
    onClose()
  }

  const logFood = (food: Omit<FoodItem, 'id'>) => {
    onAdd(mealId, { ...food, id: crypto.randomUUID() })
    handleClose()
  }

  // AI parse
  const handleAiParse = async () => {
    if (!aiText.trim()) return
    setAiLoading(true)
    setAiResult(null)
    setAiError(null)
    try {
      const { data, error } = await supabase.functions.invoke('parse-food-text', {
        body: { text: aiText.trim() },
      })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)
      setAiResult(data as ParsedFood)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Failed to parse food')
    } finally {
      setAiLoading(false)
    }
  }

  const handleManualSubmit = () => {
    if (!name || !calories) return
    logFood({ name, calories: parseFloat(calories) || 0, protein: parseFloat(protein) || 0, carbs: parseFloat(carbs) || 0, fat: parseFloat(fat) || 0 })
  }

  const handleAddStaple = () => {
    if (!sName || !sCal) return
    addStaple({ name: sName, servingSize: sServing || '1 serving', calories: parseFloat(sCal) || 0, protein: parseFloat(sProt) || 0, carbs: parseFloat(sCarbs) || 0, fat: parseFloat(sFat) || 0 })
    resetStapleForm()
  }

  const handleLogUSDA = () => {
    if (!selectedFood) return
    const g = parseFloat(servingGrams) || 100
    const scale = g / 100
    const cal = Math.round(getNutrient(selectedFood, 1008) * scale)
    const prot = Math.round(getNutrient(selectedFood, 1003) * scale)
    const cb = Math.round(getNutrient(selectedFood, 1005) * scale)
    const ft = Math.round(getNutrient(selectedFood, 1004) * scale)
    const foodName = selectedFood.description.length > 50
      ? selectedFood.description.slice(0, 50) + '…'
      : selectedFood.description
    logFood({ name: `${foodName} (${g}g)`, calories: cal, protein: prot, carbs: cb, fat: ft })
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ai',      label: 'AI' },
    { key: 'presets', label: 'Presets' },
    { key: 'staples', label: 'Staples' },
    { key: 'search',  label: 'Search' },
    { key: 'manual',  label: 'Manual' },
  ]

  const MacroRow = ({ food }: { food: ParsedFood }) => (
    <div className="bg-surface-700 rounded-xl p-3 space-y-2">
      <p className="text-sm font-semibold text-slate-100">{food.name}</p>
      {food.note && <p className="text-xs text-slate-500 italic">{food.note}</p>}
      <div className="grid grid-cols-4 gap-1 text-xs text-center">
        {([['Cal', food.calories, 'text-slate-100'], ['P', food.protein, 'text-blue-400'], ['C', food.carbs, 'text-accent'], ['F', food.fat, 'text-warn']] as [string, number, string][]).map(([label, val, color]) => (
          <div key={label} className="bg-surface-600 rounded-lg py-1.5">
            <p className="text-slate-500">{label}</p>
            <p className={`font-semibold ${color}`}>{val}{label !== 'Cal' ? 'g' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const MealSelect = () => (
    <div className="mb-3">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Log to</label>
      <select
        value={mealId}
        onChange={(e) => setMealId(e.target.value)}
        className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent"
      >
        {meals.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </div>
  )

  return (
    <Modal open={open} onClose={handleClose} title="Add Food">
      <div className="space-y-3">
        <MealSelect />

        {/* Tab bar */}
        <div className="flex bg-surface-700 rounded-xl p-1 gap-0.5">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === key ? 'bg-surface-600 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── AI ──────────────────────────────────────────────────────── */}
        {tab === 'ai' && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={aiText}
                onChange={(e) => { setAiText(e.target.value); setAiResult(null); setAiError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiParse() } }}
                placeholder="Describe what you ate…&#10;e.g. 2 scrambled eggs, slice of cheddar, whole wheat toast with butter"
                rows={3}
                className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:border-accent leading-relaxed"
              />
            </div>

            {!aiResult && (
              <Button
                fullWidth
                onClick={handleAiParse}
                disabled={!aiText.trim() || aiLoading}
              >
                {aiLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <SparklesIcon className="w-4 h-4 animate-pulse" /> Estimating…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> Estimate Macros
                  </span>
                )}
              </Button>
            )}

            {aiError && (
              <p className="text-xs text-danger text-center">{aiError}</p>
            )}

            {aiResult && (
              <div className="space-y-2">
                <MacroRow food={aiResult} />
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={resetAi}>
                    Try again
                  </Button>
                  <Button fullWidth onClick={() => logFood({ name: aiResult.name, calories: aiResult.calories, protein: aiResult.protein, carbs: aiResult.carbs, fat: aiResult.fat })}>
                    Log it
                  </Button>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-600 text-center">
              Powered by Claude Haiku · estimates based on standard portions
            </p>
          </div>
        )}

        {/* ── Presets ─────────────────────────────────────────────────── */}
        {tab === 'presets' && (
          <div className="space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPresetCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                    presetCategory === cat ? 'bg-accent text-white' : 'bg-surface-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto no-scrollbar">
              {getPresetsByCategory(presetCategory).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => logFood(foodFromPreset(preset))}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors text-left"
                >
                  <span className="text-xl">{preset.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">{preset.name}</p>
                    <p className="text-xs text-slate-500">{preset.calories} kcal · {preset.protein}g P · {preset.carbs}g C · {preset.fat}g F</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── My Staples ──────────────────────────────────────────────── */}
        {tab === 'staples' && (
          <div className="space-y-2">
            {staples.length === 0 && !showAddStaple && (
              <p className="text-sm text-slate-500 text-center py-4">No staples yet. Add your go-to foods below.</p>
            )}
            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {staples.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <button
                    onClick={() => logFood(foodFromStaple(s))}
                    className="flex-1 flex flex-col px-3 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors text-left"
                  >
                    <span className="text-sm font-semibold text-slate-100">{s.name}</span>
                    <span className="text-xs text-slate-500">{s.servingSize} · {s.calories} kcal · {s.protein}g P</span>
                  </button>
                  <button
                    onClick={() => deleteStaple(s.id)}
                    className="p-2 text-slate-600 hover:text-danger transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {!showAddStaple ? (
              <button
                onClick={() => setShowAddStaple(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-surface-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 text-sm transition-colors"
              >
                <PlusIcon className="w-4 h-4" /> Add Staple
              </button>
            ) : (
              <div className="space-y-2 pt-1 border-t border-surface-600">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">New Staple</p>
                <Input label="Name" placeholder="e.g. Chicken breast" value={sName} onChange={(e) => setSName(e.target.value)} />
                <Input label="Serving size" placeholder="e.g. 4 oz" value={sServing} onChange={(e) => setSServing(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Calories" type="number" min={0} unit="kcal" value={sCal} onChange={(e) => setSCal(e.target.value)} />
                  <Input label="Protein" type="number" min={0} unit="g" value={sProt} onChange={(e) => setSProt(e.target.value)} />
                  <Input label="Carbs" type="number" min={0} unit="g" value={sCarbs} onChange={(e) => setSCarbs(e.target.value)} />
                  <Input label="Fat" type="number" min={0} unit="g" value={sFat} onChange={(e) => setSFat(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button fullWidth variant="secondary" onClick={resetStapleForm}>Cancel</Button>
                  <Button fullWidth onClick={handleAddStaple} disabled={!sName || !sCal}>Save</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USDA Search ─────────────────────────────────────────────── */}
        {tab === 'search' && (
          <div className="space-y-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedFood(null) }}
                placeholder="Search USDA food database…"
                className="w-full bg-surface-700 border border-surface-600 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent"
              />
            </div>

            {searching && <p className="text-xs text-slate-500 text-center">Searching…</p>}

            {!selectedFood && searchResults.length > 0 && (
              <div className="space-y-1 max-h-52 overflow-y-auto no-scrollbar">
                {searchResults.map((food) => {
                  const cal = getNutrient(food, 1008)
                  const prot = getNutrient(food, 1003)
                  return (
                    <button
                      key={food.fdcId}
                      onClick={() => { setSelectedFood(food); setServingGrams('100') }}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors"
                    >
                      <p className="text-sm text-slate-100 truncate">{food.description}</p>
                      <p className="text-xs text-slate-500">per 100g: {cal} kcal · {prot}g protein</p>
                    </button>
                  )
                })}
              </div>
            )}

            {selectedFood && (
              <div className="space-y-2 pt-1 border-t border-surface-600">
                <p className="text-sm font-semibold text-slate-100 truncate">{selectedFood.description}</p>
                <div className="text-xs text-slate-400 grid grid-cols-4 gap-1">
                  {([['Cal', getNutrient(selectedFood, 1008)], ['Prot', getNutrient(selectedFood, 1003)], ['Carbs', getNutrient(selectedFood, 1005)], ['Fat', getNutrient(selectedFood, 1004)]] as [string, number][]).map(([label, val]) => (
                    <div key={label} className="bg-surface-700 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-slate-500">{label}</p>
                      <p className="text-slate-100 font-semibold">{val}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">per 100g — adjust serving below</p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input label="Serving (grams)" type="number" min={1} max={2000} unit="g" value={servingGrams} onChange={(e) => setServingGrams(e.target.value)} />
                  </div>
                  <button onClick={() => setSelectedFood(null)} className="pb-1 text-xs text-slate-500 hover:text-slate-300">← Back</button>
                </div>
                <Button fullWidth onClick={handleLogUSDA}>
                  Log {servingGrams}g
                </Button>
              </div>
            )}

            {!searching && query.length >= 2 && searchResults.length === 0 && !selectedFood && (
              <p className="text-xs text-slate-500 text-center py-2">No results found</p>
            )}
          </div>
        )}

        {/* ── Manual ──────────────────────────────────────────────────── */}
        {tab === 'manual' && (
          <div className="space-y-3">
            <Input label="Food name" placeholder="e.g. Chicken breast" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Calories" type="number" min={0} unit="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} />
              <Input label="Protein" type="number" min={0} unit="g" value={protein} onChange={(e) => setProtein(e.target.value)} />
              <Input label="Carbs" type="number" min={0} unit="g" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              <Input label="Fat" type="number" min={0} unit="g" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>
            <Button fullWidth onClick={handleManualSubmit} disabled={!name || !calories}>
              Add Food
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

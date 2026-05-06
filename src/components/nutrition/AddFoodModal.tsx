import { useState, useEffect } from 'react'
import { Modal } from '../shared/Modal'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { useStaples } from '../../hooks/useStaples'
import type { Staple } from '../../hooks/useStaples'
import type { MealPreset } from '../../data/mealLibrary'
import { useMealPresets } from '../../hooks/useMealPresets'
import type { FoodItem, Meal } from '../../types'
import { PencilSquareIcon, TrashIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

interface AddFoodModalProps {
  open: boolean
  onClose: () => void
  meals: Meal[]
  initialMealId?: string
  initialTab?: Tab
  onAdd: (mealId: string, food: FoodItem) => void
}

type Tab = 'ai' | 'presets' | 'staples'

interface ParsedFood {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sugar?: number
  note?: string
}

function foodFromPreset(preset: MealPreset): Omit<FoodItem, 'id'> {
  return { name: preset.name, calories: preset.calories, protein: preset.protein, carbs: preset.carbs, fat: preset.fat }
}

function foodFromStaple(staple: Staple): Omit<FoodItem, 'id'> {
  return { name: `${staple.name} (${staple.servingSize})`, calories: staple.calories, protein: staple.protein, carbs: staple.carbs, fat: staple.fat, ...(staple.sugar != null ? { sugar: staple.sugar } : {}) }
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: unknown })?.context
  if (context instanceof Response) {
    const payload = await context.clone().json().catch(() => null) as { error?: string } | null
    if (payload?.error) return payload.error

    const text = await context.clone().text().catch(() => '')
    if (text) return text
  }

  const message = error instanceof Error ? error.message : 'Failed to parse food'
  return message === 'Edge Function returned a non-2xx status code'
    ? 'AI nutrition estimate failed. Check that the Supabase function is deployed and its Anthropic key is configured.'
    : message
}

const PRESET_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const
type PresetCategory = typeof PRESET_CATEGORIES[number]

function getPresetCategoryForMeal(mealId: string): PresetCategory | null {
  if (mealId === 'snacks') return 'snack'
  return PRESET_CATEGORIES.includes(mealId as PresetCategory) ? mealId as PresetCategory : null
}

function getMealIdForCategory(category: PresetCategory): string {
  return category === 'snack' || category === 'dessert' ? 'snacks' : category
}

export function AddFoodModal({ open, onClose, meals, initialMealId, initialTab, onAdd }: AddFoodModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab ?? 'presets')
  const [mealId, setMealId] = useState(meals[0]?.id ?? '')
  const { staples, addStaple, updateStaple, deleteStaple } = useStaples()
  const { getPresetsByCategory, updatePreset, deletePreset } = useMealPresets()

  // AI tab
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<ParsedFood | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Presets
  const [presetCategory, setPresetCategory] = useState<typeof PRESET_CATEGORIES[number]>('breakfast')
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
  const [pName, setPName] = useState('')
  const [pDescription, setPDescription] = useState('')
  const [pEmoji, setPEmoji] = useState('')
  const [pCategory, setPCategory] = useState<PresetCategory>('breakfast')
  const [pCal, setPCal] = useState('')
  const [pProt, setPProt] = useState('')
  const [pCarbs, setPCarbs] = useState('')
  const [pFat, setPFat] = useState('')

  // Staples - add form
  const [showAddStaple, setShowAddStaple] = useState(false)
  const [sName, setSName] = useState('')
  const [sServing, setSServing] = useState('')
  const [sMealDefinition, setSMealDefinition] = useState<PresetCategory>('snack')
  const [sCal, setSCal] = useState('')
  const [sProt, setSProt] = useState('')
  const [sCarbs, setSCarbs] = useState('')
  const [sFat, setSFat] = useState('')
  const [sSugar, setSSugar] = useState('')
  const [editingStapleId, setEditingStapleId] = useState<string | null>(null)

  useEffect(() => {
    if (meals.length > 0 && !meals.find((m) => m.id === mealId)) {
      setMealId(meals[0].id)
    }
  }, [meals, mealId])

  useEffect(() => {
    if (!open) return
    const preferredMealId = initialMealId && meals.some((m) => m.id === initialMealId)
      ? initialMealId
      : meals[0]?.id
    if (preferredMealId) {
      setMealId(preferredMealId)
      const matchingCategory = getPresetCategoryForMeal(preferredMealId)
      if (matchingCategory) setPresetCategory(matchingCategory)
    }
    setTab(initialTab ?? 'presets')
  }, [open, initialMealId, initialTab, meals])

  const resetStapleForm = () => { setSName(''); setSServing(''); setSMealDefinition('snack'); setSCal(''); setSProt(''); setSCarbs(''); setSFat(''); setSSugar(''); setEditingStapleId(null); setShowAddStaple(false) }
  const resetPresetForm = () => { setPName(''); setPDescription(''); setPEmoji(''); setPCategory('breakfast'); setPCal(''); setPProt(''); setPCarbs(''); setPFat(''); setEditingPresetId(null) }
  const resetAi = () => { setAiText(''); setAiResult(null); setAiError(null) }

  const handleClose = () => {
    resetStapleForm()
    resetPresetForm()
    resetAi()
    onClose()
  }

  const logFood = (food: Omit<FoodItem, 'id'>, targetMealId = mealId) => {
    const normalizedMealId = meals.some((meal) => meal.id === targetMealId) ? targetMealId : mealId
    onAdd(normalizedMealId, { ...food, id: crypto.randomUUID() })
    handleClose()
  }

  const foodFromAiResult = (food: ParsedFood): Omit<FoodItem, 'id'> => ({
    name: food.name,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    ...(food.sugar != null ? { sugar: food.sugar } : {}),
  })

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
      if (error) throw new Error(await getFunctionErrorMessage(error))
      if (data?.error) throw new Error(data.error)
      setAiResult(data as ParsedFood)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Failed to parse food')
    } finally {
      setAiLoading(false)
    }
  }

  const handleMealChange = (nextMealId: string) => {
    setMealId(nextMealId)
    const matchingCategory = getPresetCategoryForMeal(nextMealId)
    if (matchingCategory) setPresetCategory(matchingCategory)
  }

  const handlePresetCategoryChange = (category: PresetCategory) => {
    setPresetCategory(category)
    const matchingMealId = getMealIdForCategory(category)
    if (meals.some((meal) => meal.id === matchingMealId)) setMealId(matchingMealId)
  }

  const getStapleFromForm = (): Omit<Staple, 'id'> => ({
    name: sName.trim(),
    servingSize: sServing.trim() || '1 serving',
    mealDefinition: sMealDefinition,
    calories: parseFloat(sCal) || 0,
    protein: parseFloat(sProt) || 0,
    carbs: parseFloat(sCarbs) || 0,
    fat: parseFloat(sFat) || 0,
    sugar: parseFloat(sSugar) || 0,
  })

  const handleSaveStaple = () => {
    if (!sName || !sCal) return
    const staple = getStapleFromForm()
    if (editingStapleId) {
      updateStaple(editingStapleId, staple)
    } else {
      addStaple(staple)
    }
    resetStapleForm()
  }

  const handleEditStaple = (staple: Staple) => {
    setEditingStapleId(staple.id)
    setSName(staple.name)
    setSServing(staple.servingSize)
    setSMealDefinition(staple.mealDefinition)
    setSCal(String(staple.calories))
    setSProt(String(staple.protein))
    setSCarbs(String(staple.carbs))
    setSFat(String(staple.fat))
    setSSugar(String(staple.sugar ?? 0))
    setShowAddStaple(true)
  }

  const handleLogAiAndAddStaple = async () => {
    if (!aiResult) return
    const food = foodFromAiResult(aiResult)
    await addStaple({
      name: aiResult.name,
      servingSize: '1 serving',
      mealDefinition: getPresetCategoryForMeal(mealId) ?? 'snack',
      calories: aiResult.calories,
      protein: aiResult.protein,
      carbs: aiResult.carbs,
      fat: aiResult.fat,
      sugar: aiResult.sugar ?? 0,
    })
    logFood(food)
  }

  const handleEditPreset = (preset: MealPreset) => {
    setEditingPresetId(preset.id)
    setPName(preset.name)
    setPDescription(preset.description)
    setPEmoji(preset.emoji)
    setPCategory(preset.category)
    setPCal(String(preset.calories))
    setPProt(String(preset.protein))
    setPCarbs(String(preset.carbs))
    setPFat(String(preset.fat))
  }

  const handleSavePreset = () => {
    if (!editingPresetId || !pName || !pCal) return
    updatePreset({
      id: editingPresetId,
      name: pName.trim(),
      description: pDescription.trim(),
      emoji: pEmoji.trim() || '🍽️',
      category: pCategory,
      calories: parseFloat(pCal) || 0,
      protein: parseFloat(pProt) || 0,
      carbs: parseFloat(pCarbs) || 0,
      fat: parseFloat(pFat) || 0,
    })
    setPresetCategory(pCategory)
    resetPresetForm()
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ai',      label: 'AI' },
    { key: 'presets', label: 'Presets' },
    { key: 'staples', label: 'Staples' },
  ]

  const MacroRow = ({ food }: { food: ParsedFood }) => {
    const cols: [string, number, string][] = [
      ['Cal', food.calories, 'text-slate-100'],
      ['P', food.protein, 'text-blue-400'],
      ['C', food.carbs, 'text-accent'],
      ['F', food.fat, 'text-warn'],
    ]
    if (food.sugar != null) cols.push(['Sug', food.sugar, 'text-orange-400'])
    return (
      <div className="bg-surface-700 rounded-xl p-3 space-y-2">
        <p className="text-sm font-semibold text-slate-100">{food.name}</p>
        {food.note && <p className="text-xs text-slate-500 italic">{food.note}</p>}
        <div className={`grid gap-1 text-xs text-center ${cols.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {cols.map(([label, val, color]) => (
            <div key={label} className="bg-surface-600 rounded-lg py-1.5">
              <p className="text-slate-500">{label}</p>
              <p className={`font-semibold ${color}`}>{val}{label !== 'Cal' ? 'g' : ''}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const MealSelect = () => (
    <div className="mb-3">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Log to</label>
      <select
        value={mealId}
        onChange={(e) => handleMealChange(e.target.value)}
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
                  <Button fullWidth onClick={() => logFood(foodFromAiResult(aiResult))}>
                    Log it
                  </Button>
                </div>
                <Button variant="secondary" fullWidth onClick={handleLogAiAndAddStaple}>
                  Log and add to staple
                </Button>
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
                  onClick={() => handlePresetCategoryChange(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                    presetCategory === cat ? 'bg-accent text-white' : 'bg-surface-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
              {getPresetsByCategory(presetCategory).map((preset) => (
                <div key={preset.id} className="flex items-center gap-2">
                  <button
                    onClick={() => logFood(foodFromPreset(preset), getMealIdForCategory(preset.category))}
                    className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors text-left min-w-0"
                  >
                    <span className="text-xl">{preset.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{preset.name}</p>
                      {preset.description && (
                        <p className="text-xs text-slate-400 leading-snug mt-0.5">{preset.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">{preset.calories} kcal · {preset.protein}g P · {preset.carbs}g C · {preset.fat}g F</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleEditPreset(preset)}
                    className="p-2 text-slate-500 hover:text-slate-200 transition-colors"
                    aria-label={`Edit ${preset.name}`}
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="p-2 text-slate-600 hover:text-danger transition-colors"
                    aria-label={`Delete ${preset.name}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {editingPresetId && (
              <div className="space-y-2 pt-2 border-t border-surface-600">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Edit Preset</p>
                <div className="grid grid-cols-[72px_1fr] gap-2">
                  <Input label="Emoji" value={pEmoji} onChange={(e) => setPEmoji(e.target.value)} />
                  <Input label="Name" placeholder="e.g. Chicken bowl" value={pName} onChange={(e) => setPName(e.target.value)} />
                </div>
                <Input label="Description" placeholder="What is included?" value={pDescription} onChange={(e) => setPDescription(e.target.value)} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Meal Definition</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value as PresetCategory)}
                    className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent"
                  >
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Calories" type="number" min={0} unit="kcal" value={pCal} onChange={(e) => setPCal(e.target.value)} />
                  <Input label="Protein" type="number" min={0} unit="g" value={pProt} onChange={(e) => setPProt(e.target.value)} />
                  <Input label="Carbs" type="number" min={0} unit="g" value={pCarbs} onChange={(e) => setPCarbs(e.target.value)} />
                  <Input label="Fat" type="number" min={0} unit="g" value={pFat} onChange={(e) => setPFat(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button fullWidth variant="secondary" onClick={resetPresetForm}>Cancel</Button>
                  <Button fullWidth onClick={handleSavePreset} disabled={!pName || !pCal}>Save Changes</Button>
                </div>
              </div>
            )}
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
                    onClick={() => logFood(foodFromStaple(s), getMealIdForCategory(s.mealDefinition))}
                    className="flex-1 flex flex-col px-3 py-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors text-left"
                  >
                    <span className="text-sm font-semibold text-slate-100">{s.name}</span>
                    <span className="text-xs text-slate-500 capitalize">{s.mealDefinition} · {s.servingSize} · {s.calories} kcal · {s.protein}g P{s.sugar != null ? ` · ${s.sugar}g sugar` : ''}</span>
                  </button>
                  <button
                    onClick={() => handleEditStaple(s)}
                    className="p-2 text-slate-500 hover:text-slate-200 transition-colors"
                    aria-label={`Edit ${s.name}`}
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteStaple(s.id)}
                    className="p-2 text-slate-600 hover:text-danger transition-colors"
                    aria-label={`Delete ${s.name}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {!showAddStaple ? (
              <button
                onClick={() => {
                  setSMealDefinition(getPresetCategoryForMeal(mealId) ?? presetCategory)
                  setShowAddStaple(true)
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-surface-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 text-sm transition-colors"
              >
                <PlusIcon className="w-4 h-4" /> Add Staple
              </button>
            ) : (
              <div className="space-y-2 pt-1 border-t border-surface-600">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {editingStapleId ? 'Edit Staple' : 'New Staple'}
                </p>
                <Input label="Name" placeholder="e.g. Chicken breast" value={sName} onChange={(e) => setSName(e.target.value)} />
                <Input label="Serving size" placeholder="e.g. 4 oz" value={sServing} onChange={(e) => setSServing(e.target.value)} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Meal Definition</label>
                  <select
                    value={sMealDefinition}
                    onChange={(e) => setSMealDefinition(e.target.value as PresetCategory)}
                    className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent"
                  >
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Calories" type="number" min={0} unit="kcal" value={sCal} onChange={(e) => setSCal(e.target.value)} />
                  <Input label="Protein" type="number" min={0} unit="g" value={sProt} onChange={(e) => setSProt(e.target.value)} />
                  <Input label="Carbs" type="number" min={0} unit="g" value={sCarbs} onChange={(e) => setSCarbs(e.target.value)} />
                  <Input label="Fat" type="number" min={0} unit="g" value={sFat} onChange={(e) => setSFat(e.target.value)} />
                  <Input label="Sugar" type="number" min={0} unit="g" value={sSugar} onChange={(e) => setSSugar(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button fullWidth variant="secondary" onClick={resetStapleForm}>Cancel</Button>
                  <Button fullWidth onClick={handleSaveStaple} disabled={!sName || !sCal}>
                    {editingStapleId ? 'Save Changes' : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

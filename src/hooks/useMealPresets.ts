import { useCallback, useMemo } from 'react'
import { MEAL_PRESETS } from '../data/mealLibrary'
import type { MealPreset } from '../data/mealLibrary'
import { useLocalStorage } from './useLocalStorage'

interface MealPresetState {
  edited: Record<string, MealPreset>
  deleted: string[]
}

const STORAGE_KEY = 'meal_presets_v1'
const INITIAL_STATE: MealPresetState = { edited: {}, deleted: [] }

export function useMealPresets() {
  const [state, setState] = useLocalStorage<MealPresetState>(STORAGE_KEY, INITIAL_STATE)

  const presets = useMemo(() => (
    MEAL_PRESETS
      .filter((preset) => !state.deleted.includes(preset.id))
      .map((preset) => state.edited[preset.id] ?? preset)
  ), [state.deleted, state.edited])

  const getPresetsByCategory = useCallback((category: MealPreset['category']) => (
    presets.filter((preset) => preset.category === category)
  ), [presets])

  const updatePreset = useCallback((preset: MealPreset) => {
    setState((prev) => ({
      deleted: prev.deleted.filter((id) => id !== preset.id),
      edited: { ...prev.edited, [preset.id]: preset },
    }))
  }, [setState])

  const deletePreset = useCallback((id: string) => {
    setState((prev) => {
      const edited = { ...prev.edited }
      delete edited[id]
      return {
        edited,
        deleted: prev.deleted.includes(id) ? prev.deleted : [...prev.deleted, id],
      }
    })
  }, [setState])

  return { presets, getPresetsByCategory, updatePreset, deletePreset }
}

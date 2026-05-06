import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export interface AppSettings {
  googleClientId: string
  microsoftClientId: string
  ouraToken: string
  healthContext: string
  programStartDate: string
  progressionAggressiveness: 'conservative' | 'balanced' | 'assertive'
  progressionDeloadMisses: number
  progressionMaxJump: number
}

const DEFAULT_SETTINGS: AppSettings = {
  googleClientId: '',
  microsoftClientId: '',
  ouraToken: '',
  healthContext: '',
  programStartDate: '',
  progressionAggressiveness: 'balanced',
  progressionDeloadMisses: 3,
  progressionMaxJump: 5,
}
const MICROSOFT_CLIENT_ID_KEY = 'ms_client_id_v1'
const PROGRESSION_AGGRESSIVENESS_KEY = 'progression_aggressiveness_v1'
const PROGRESSION_DELOAD_MISSES_KEY = 'progression_deload_misses_v1'
const PROGRESSION_MAX_JUMP_KEY = 'progression_max_jump_v1'

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    supabase
      .from('profiles')
      .select('google_client_id, oura_token, health_context, program_start_date')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const microsoftClientId = localStorage.getItem(MICROSOFT_CLIENT_ID_KEY) ?? ''
        const progressionAggressiveness =
          (localStorage.getItem(PROGRESSION_AGGRESSIVENESS_KEY) as AppSettings['progressionAggressiveness']) ?? 'balanced'
        const progressionDeloadMisses = Number(localStorage.getItem(PROGRESSION_DELOAD_MISSES_KEY) ?? 3)
        const progressionMaxJump = Number(localStorage.getItem(PROGRESSION_MAX_JUMP_KEY) ?? 5)
        if (data) {
          setSettingsState({
            googleClientId: (data.google_client_id as string) ?? '',
            microsoftClientId,
            ouraToken: (data.oura_token as string) ?? '',
            healthContext: (data.health_context as string) ?? '',
            programStartDate: (data.program_start_date as string) ?? '',
            progressionAggressiveness,
            progressionDeloadMisses,
            progressionMaxJump,
          })
        } else {
          setSettingsState((prev) => ({
            ...prev,
            microsoftClientId,
            progressionAggressiveness,
            progressionDeloadMisses,
            progressionMaxJump,
          }))
        }
      })
      .catch((error) => {
        console.error('Failed to load profile settings', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user])

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!user) return
    const merged = { ...settings, ...updates }
    localStorage.setItem(MICROSOFT_CLIENT_ID_KEY, merged.microsoftClientId || '')
    localStorage.setItem(PROGRESSION_AGGRESSIVENESS_KEY, merged.progressionAggressiveness)
    localStorage.setItem(PROGRESSION_DELOAD_MISSES_KEY, String(merged.progressionDeloadMisses))
    localStorage.setItem(PROGRESSION_MAX_JUMP_KEY, String(merged.progressionMaxJump))

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      google_client_id: merged.googleClientId || null,
      oura_token: merged.ouraToken || null,
      health_context: merged.healthContext || null,
      program_start_date: merged.programStartDate || null,
    }, { onConflict: 'id' })

    if (error) {
      console.error('Failed to save profile settings', error)
      return
    }

    setSettingsState(merged)
  }, [user, settings])

  return {
    settings,
    loading,
    updateSettings,
    hasGoogleClientId: Boolean(settings.googleClientId),
    hasMicrosoftClientId: Boolean(settings.microsoftClientId),
    hasOuraToken: Boolean(settings.ouraToken),
    hasHealthContext: Boolean(settings.healthContext),
  }
}

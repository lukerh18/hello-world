import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export interface AppSettings {
  googleClientId: string
  ouraToken: string
  healthContext: string
  programStartDate: string
}

const DEFAULT_SETTINGS: AppSettings = {
  googleClientId: '',
  ouraToken: '',
  healthContext: '',
  programStartDate: '',
}

const LS_KEY = 'app_settings_v1'

function lsRead(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

export function useSettings() {
  const { user, isLocal } = useAuth()
  const [settings, setSettingsState] = useState<AppSettings>(isLocal ? lsRead() : DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(!isLocal)

  useEffect(() => {
    if (isLocal) return
    if (!user) { setLoading(false); return }

    supabase
      .from('profiles')
      .select('google_client_id, oura_token, health_context, program_start_date')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettingsState({
            googleClientId: (data.google_client_id as string) ?? '',
            ouraToken: (data.oura_token as string) ?? '',
            healthContext: (data.health_context as string) ?? '',
            programStartDate: (data.program_start_date as string) ?? '',
          })
        }
        setLoading(false)
      })
  }, [user, isLocal])

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const merged = { ...settings, ...updates }
    setSettingsState(merged)
    if (isLocal) {
      localStorage.setItem(LS_KEY, JSON.stringify(merged))
      return
    }
    if (!user) return
    await supabase.from('profiles').upsert({
      id: user.id,
      google_client_id: merged.googleClientId || null,
      oura_token: merged.ouraToken || null,
      health_context: merged.healthContext || null,
      program_start_date: merged.programStartDate || null,
    }, { onConflict: 'id' })
  }, [user, isLocal, settings])

  return {
    settings,
    loading,
    updateSettings,
    hasGoogleClientId: Boolean(settings.googleClientId),
    hasOuraToken: Boolean(settings.ouraToken),
    hasHealthContext: Boolean(settings.healthContext),
  }
}

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
  }, [user])

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!user) return
    const merged = { ...settings, ...updates }
    await supabase.from('profiles').upsert({
      id: user.id,
      google_client_id: merged.googleClientId || null,
      oura_token: merged.ouraToken || null,
      health_context: merged.healthContext || null,
      program_start_date: merged.programStartDate || null,
    }, { onConflict: 'id' })
    setSettingsState(merged)
  }, [user, settings])

  return {
    settings,
    loading,
    updateSettings,
    hasGoogleClientId: Boolean(settings.googleClientId),
    hasOuraToken: Boolean(settings.ouraToken),
    hasHealthContext: Boolean(settings.healthContext),
  }
}

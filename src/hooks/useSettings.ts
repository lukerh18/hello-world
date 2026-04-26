import { useLocalStorage } from './useLocalStorage'

export interface AppSettings {
  anthropicApiKey: string
  googleClientId: string
  ouraToken: string
  healthContext: string
  programStartDate: string
}

const DEFAULT_SETTINGS: AppSettings = {
  anthropicApiKey: '',
  googleClientId: '',
  ouraToken: '',
  healthContext: '',
  programStartDate: '',
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<AppSettings>('app_settings', DEFAULT_SETTINGS)

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  return {
    settings,
    updateSettings,
    hasApiKey: Boolean(settings.anthropicApiKey),
    hasGoogleClientId: Boolean(settings.googleClientId),
    hasHealthContext: Boolean(settings.healthContext),
  }
}

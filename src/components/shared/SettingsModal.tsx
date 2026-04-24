import { useState } from 'react'
import { Modal } from './Modal'
import { Input } from './Input'
import { Button } from './Button'
import { useSettings } from '../../hooks/useSettings'
import { KeyIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, updateSettings, hasApiKey, hasGoogleClientId } = useSettings()
  const [apiKey, setApiKey] = useState(settings.anthropicApiKey)
  const [clientId, setClientId] = useState(settings.googleClientId)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateSettings({ anthropicApiKey: apiKey.trim(), googleClientId: clientId.trim() })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-6">

        {/* Anthropic API Key */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <KeyIcon className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-slate-200">Anthropic API Key</h3>
            {hasApiKey && <CheckCircleIcon className="w-4 h-4 text-success ml-auto" />}
          </div>
          <p className="text-xs text-slate-400">
            Used to analyze food photos with AI. Your key is stored only on this device.
          </p>
          <Input
            label="API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
          />
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            Get your API key at console.anthropic.com →
          </a>
        </section>

        {/* Google Calendar */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Google Calendar</h3>
            {hasGoogleClientId && <CheckCircleIcon className="w-4 h-4 text-success ml-auto" />}
          </div>
          <p className="text-xs text-slate-400">
            Connects your Google Calendar to find open workout slots and schedule sessions.
          </p>
          <Input
            label="Google OAuth Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="xxxxx.apps.googleusercontent.com"
          />
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer text-accent hover:text-accent-light">
              Setup instructions (one-time) →
            </summary>
            <ol className="mt-2 space-y-1 list-decimal list-inside text-slate-400">
              <li>Go to <span className="text-slate-300">console.cloud.google.com</span></li>
              <li>Create a new project → Enable <span className="text-slate-300">Google Calendar API</span></li>
              <li>APIs &amp; Services → Credentials → <span className="text-slate-300">Create OAuth 2.0 Client ID</span></li>
              <li>Type: <span className="text-slate-300">Web Application</span></li>
              <li>Authorized JavaScript origin: <span className="text-slate-300 break-all">https://lukerh18.github.io</span></li>
              <li>Copy the Client ID and paste it above</li>
            </ol>
          </details>
        </section>

        <Button fullWidth onClick={handleSave} variant={saved ? 'secondary' : 'primary'}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </Button>
      </div>
    </Modal>
  )
}

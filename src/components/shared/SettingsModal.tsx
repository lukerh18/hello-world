import { useState } from 'react'
import { Modal } from './Modal'
import { Input } from './Input'
import { Button } from './Button'
import { useSettings } from '../../hooks/useSettings'
import { CalendarIcon, CheckCircleIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/auth'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, updateSettings, hasGoogleClientId, hasHealthContext } = useSettings()
  const { signOut } = useAuth()
  const [clientId, setClientId] = useState(settings.googleClientId)
  const [ouraToken, setOuraToken] = useState(settings.ouraToken)
  const [healthContext, setHealthContext] = useState(settings.healthContext)
  const [programStart, setProgramStart] = useState(settings.programStartDate || '')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await updateSettings({
      googleClientId: clientId.trim(),
      ouraToken: ouraToken.trim(),
      healthContext: healthContext.trim(),
      programStartDate: programStart,
    })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-6">

        {/* Program Start Date */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-slate-200">Program Start Date</h3>
          </div>
          <p className="text-xs text-slate-400">
            Sets week 1 of your 12-week program. Update this if you're restarting or adjusting.
          </p>
          <Input
            label="Start Date"
            type="date"
            value={programStart}
            onChange={(e) => setProgramStart(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </section>

        {/* Health Context */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <HeartIcon className="w-4 h-4 text-danger" />
            <h3 className="text-sm font-semibold text-slate-200">Health Context</h3>
            {hasHealthContext && <CheckCircleIcon className="w-4 h-4 text-success ml-auto" />}
          </div>
          <p className="text-xs text-slate-400">
            Paste bloodwork, health diagnostics, or any relevant context. Used to personalize your AI coaching and Perplexity health answers.
          </p>
          <textarea
            value={healthContext}
            onChange={(e) => setHealthContext(e.target.value)}
            rows={6}
            placeholder={`e.g. From bloodwork or health diagnostic:\nTestosterone: 650 ng/dL\nVitamin D: 42 ng/mL\nHbA1c: 5.1%\nCortisol: 18 mcg/dL\nFerritin: 95 ng/mL`}
            className="w-full bg-surface-700 border border-surface-600 rounded-xl px-3 py-2.5 text-xs text-slate-300 resize-none focus:outline-none focus:border-accent placeholder-slate-600 leading-relaxed"
          />
        </section>

        {/* Oura Ring */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-danger" />
            <h3 className="text-sm font-semibold text-slate-200">Oura Ring</h3>
            {ouraToken && <CheckCircleIcon className="w-4 h-4 text-success ml-auto" />}
          </div>
          <p className="text-xs text-slate-400">
            Pulls sleep, readiness, HRV, and activity scores from your ring to personalize coaching.
          </p>
          <Input
            label="Personal Access Token"
            type="password"
            value={ouraToken}
            onChange={(e) => setOuraToken(e.target.value)}
            placeholder="eyJ..."
          />
          <a
            href="https://cloud.ouraring.com/personal-access-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            Generate your token at cloud.ouraring.com →
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
            Shows your day's schedule, highlights soccer games and kids' activities.
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
              <li>Authorized JavaScript origin: your app's URL</li>
              <li>Copy the Client ID and paste it above</li>
            </ol>
          </details>
        </section>

        <Button fullWidth onClick={handleSave} variant={saved ? 'secondary' : 'primary'}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </Button>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors pt-2"
        >
          Sign out
        </button>

      </div>
    </Modal>
  )
}

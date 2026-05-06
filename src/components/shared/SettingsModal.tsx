import { useState } from 'react'
import { Modal } from './Modal'
import { Input } from './Input'
import { Button } from './Button'
import { useSettings } from '../../hooks/useSettings'
import { useMealReminders } from '../../hooks/useMealReminders'
import { BellIcon, CalendarIcon, CheckCircleIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/auth'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, updateSettings, hasHealthContext } = useSettings()
  const { signOut } = useAuth()
  const { reminders, permission, toggle, setTime, requestPermission, isNative } = useMealReminders()
  const [ouraToken, setOuraToken] = useState(settings.ouraToken)
  const [healthContext, setHealthContext] = useState(settings.healthContext)
  const [programStart, setProgramStart] = useState(settings.programStartDate || '')
  const [progressionAggressiveness, setProgressionAggressiveness] = useState(settings.progressionAggressiveness)
  const [progressionDeloadMisses, setProgressionDeloadMisses] = useState(String(settings.progressionDeloadMisses))
  const [progressionMaxJump, setProgressionMaxJump] = useState(String(settings.progressionMaxJump))
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await updateSettings({
      ouraToken: ouraToken.trim(),
      healthContext: healthContext.trim(),
      programStartDate: programStart,
      progressionAggressiveness,
      progressionDeloadMisses: Math.max(2, Number(progressionDeloadMisses) || 3),
      progressionMaxJump: Math.max(2.5, Number(progressionMaxJump) || 5),
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
            <h3 className="text-sm font-semibold text-text-primary">Program Start Date</h3>
          </div>
          <p className="text-xs text-text-secondary">
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

        {/* Oura Ring */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-danger" />
            <h3 className="text-sm font-semibold text-text-primary">Oura Ring</h3>
            {ouraToken && <CheckCircleIcon className="w-4 h-4 text-success ml-auto" />}
          </div>
          <p className="text-xs text-text-secondary">
            Pulls sleep, readiness, HRV, and activity scores from your ring.
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

        {/* Progression Preferences */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Progression Safety</h3>
          </div>
          <p className="text-xs text-text-secondary">
            Controls how quickly suggested weight increases and when deload suggestions appear.
          </p>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">Aggressiveness</label>
            <select
              value={progressionAggressiveness}
              onChange={(e) => setProgressionAggressiveness(e.target.value as typeof settings.progressionAggressiveness)}
              className="focus-rivian w-full bg-surface-700 border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="assertive">Assertive</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Deload after misses"
              type="number"
              min={2}
              max={5}
              value={progressionDeloadMisses}
              onChange={(e) => setProgressionDeloadMisses(e.target.value)}
            />
            <Input
              label="Max jump per session"
              type="number"
              min={2.5}
              step={2.5}
              unit="lbs"
              value={progressionMaxJump}
              onChange={(e) => setProgressionMaxJump(e.target.value)}
            />
          </div>
        </section>

        {/* Health Context */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <HeartIcon className="w-4 h-4 text-danger" />
            <h3 className="text-sm font-semibold text-text-primary">Health Context</h3>
            {hasHealthContext && <CheckCircleIcon className="w-4 h-4 text-success ml-auto" />}
          </div>
          <p className="text-xs text-text-secondary">
            Paste bloodwork or diagnostics to personalize AI coaching.
          </p>
          <textarea
            value={healthContext}
            onChange={(e) => setHealthContext(e.target.value)}
            rows={5}
            placeholder={`e.g. Testosterone: 650 ng/dL\nVitamin D: 42 ng/mL\nHbA1c: 5.1%`}
            className="focus-rivian w-full bg-surface-700 border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-secondary resize-none focus:outline-none focus:border-accent placeholder:text-text-muted leading-relaxed"
          />
        </section>

        {/* Notifications */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <BellIcon className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Meal Reminders</h3>
            {permission === 'granted' && <CheckCircleIcon className="w-4 h-4 text-success ml-auto" />}
          </div>

          {permission !== 'granted' && (
            <div className="panel-surface rounded-xl bg-surface-700 p-3 space-y-2">
              <p className="text-xs text-text-secondary">
                {permission === 'denied'
                  ? 'Notifications are blocked. Enable them in your device Settings → Notifications.'
                  : isNative
                  ? 'Allow notifications to get daily meal logging reminders on your iPhone.'
                  : 'Browser notifications let you get meal logging reminders (iOS app recommended).'}
              </p>
              {permission !== 'denied' && (
                <button
                  onClick={requestPermission}
                  className="focus-rivian text-xs font-medium text-accent hover:text-accent-light transition-colors"
                >
                  Enable Notifications →
                </button>
              )}
            </div>
          )}

          <div className="space-y-2">
            {reminders.map((r) => (
              <div key={r.mealId} className="panel-surface flex items-center gap-3 bg-surface-700 rounded-xl px-3 py-2.5">
                <button
                  onClick={() => toggle(r.mealId)}
                  className={`focus-rivian w-9 h-5 rounded-full transition-colors flex-shrink-0 ${r.enabled ? 'bg-accent' : 'bg-surface-600'}`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${r.enabled ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
                <span className="text-sm text-text-secondary flex-1">{r.label}</span>
                <input
                  type="time"
                  value={r.time}
                  onChange={(e) => setTime(r.mealId, e.target.value)}
                  disabled={!r.enabled}
                  className="focus-rivian bg-surface-600 border border-border-subtle rounded-xl px-2 py-1 text-xs text-text-primary disabled:opacity-40 focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>

          {isNative && permission === 'granted' && (
            <p className="text-xs text-text-muted">Reminders fire daily even when the app is closed.</p>
          )}
        </section>

        <Button fullWidth onClick={handleSave} variant={saved ? 'secondary' : 'primary'}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </Button>

        <button
          onClick={signOut}
          className="focus-rivian w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors pt-2"
        >
          Sign out
        </button>

      </div>
    </Modal>
  )
}

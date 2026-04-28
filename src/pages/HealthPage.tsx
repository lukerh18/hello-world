import { useRef, useState } from 'react'
import { useHealthIntelligence } from '../hooks/useHealthIntelligence'
import { useSettings } from '../hooks/useSettings'
import { supabase } from '../lib/supabase'
import { SparklesIcon, UserCircleIcon } from '@heroicons/react/24/outline'

const SUGGESTED_QUESTIONS = [
  'What does the research say about protein timing around workouts?',
  'How does sleep affect muscle recovery and growth?',
  'What are the best evidence-based strategies for fat loss while preserving muscle?',
  'How much water should I drink daily for optimal performance?',
  'What does creatine actually do and should I take it?',
]

const ACTIVITY_LEVELS = [
  'Sedentary (desk job, little exercise)',
  'Lightly active (1–3 workouts/week)',
  'Moderately active (3–5 workouts/week)',
  'Very active (6+ workouts/week or physical job)',
]

function GenerateProfileModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: (profile: string) => void }) {
  const [age, setAge] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [weight, setWeight] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [activityLevel, setActivityLevel] = useState(ACTIVITY_LEVELS[2])
  const [sleepHours, setSleepHours] = useState('')
  const [healthGoals, setHealthGoals] = useState('')
  const [knownConditions, setKnownConditions] = useState('')
  const [medications, setMedications] = useState('')
  const [bloodwork, setBloodwork] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const heightInTotal = heightFt ? parseInt(heightFt) * 12 + (parseInt(heightIn) || 0) : undefined
      const { data, error: fnErr } = await supabase.functions.invoke('generate-health-profile', {
        body: {
          age: age ? parseInt(age) : undefined,
          heightIn: heightInTotal,
          weightLbs: weight ? parseFloat(weight) : undefined,
          goalWeightLbs: goalWeight ? parseFloat(goalWeight) : undefined,
          activityLevel,
          sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
          healthGoals: healthGoals || undefined,
          knownConditions: knownConditions || undefined,
          medications: medications || undefined,
          bloodwork: bloodwork || undefined,
        },
      })
      if (fnErr) throw new Error(fnErr.message)
      onGenerated(data.profile as string)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-surface-800 rounded-t-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-800 px-4 pt-4 pb-3 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base">Generate Health Profile</h2>
            <p className="text-slate-400 text-xs mt-0.5">Perplexity analyzes your data and builds a personalized health context</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Age</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="34"
                className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Sleep (hrs/night)</label>
              <input type="number" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="7.5"
                className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Height</label>
            <div className="flex gap-2">
              <input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="5 ft"
                className="w-1/2 bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
              <input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="11 in"
                className="w-1/2 bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Current weight (lbs)</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="193"
                className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Goal weight (lbs)</label>
              <input type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} placeholder="185"
                className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Activity level</label>
            <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent">
              {ACTIVITY_LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Health goals</label>
            <textarea value={healthGoals} onChange={(e) => setHealthGoals(e.target.value)} rows={2}
              placeholder="e.g. Lose fat while building muscle, improve energy, better sleep quality"
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent resize-none placeholder-slate-600" />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Known conditions (optional)</label>
            <input type="text" value={knownConditions} onChange={(e) => setKnownConditions(e.target.value)}
              placeholder="e.g. High blood pressure, pre-diabetes"
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Medications / supplements (optional)</label>
            <input type="text" value={medications} onChange={(e) => setMedications(e.target.value)}
              placeholder="e.g. Metformin, creatine, vitamin D"
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent" />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Bloodwork / lab results (optional)</label>
            <textarea value={bloodwork} onChange={(e) => setBloodwork(e.target.value)} rows={4}
              placeholder={`Paste any lab values here:\nTestosterone: 650 ng/dL\nVitamin D: 42 ng/mL\nHbA1c: 5.1%\nFerritin: 95 ng/mL`}
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent resize-none placeholder-slate-600 font-mono text-xs" />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-accent text-white font-semibold py-3 rounded-xl disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <SparklesIcon className="w-4 h-4 animate-pulse" />
                Analyzing with Perplexity…
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Generate My Health Profile
              </>
            )}
          </button>
          {loading && (
            <p className="text-center text-xs text-slate-500">This takes ~15 seconds</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HealthPage() {
  const { settings, updateSettings, hasHealthContext } = useSettings()
  const { history, loading, error, ask } = useHealthIntelligence(settings.healthContext)
  const [question, setQuestion] = useState('')
  const [activeEntry, setActiveEntry] = useState<string | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleAsk = async (q: string) => {
    if (!q.trim() || loading) return
    setQuestion('')
    const entry = await ask(q.trim())
    if (entry) setActiveEntry(entry.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk(question)
    }
  }

  const handleProfileGenerated = async (profile: string) => {
    await updateSettings({ healthContext: profile })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const active = history.find((h) => h.id === activeEntry) ?? history[0] ?? null

  return (
    <div className="min-h-dvh bg-surface-900 pb-24">
      <div className="px-4 pt-6 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Health Intelligence</h1>
          <p className="text-slate-400 text-sm mt-1">Evidence-based answers, powered by Perplexity</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-1.5 bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 hover:border-accent/40 transition-colors"
        >
          <UserCircleIcon className="w-4 h-4 text-accent" />
          {hasHealthContext ? 'Update profile' : 'Build profile'}
        </button>
      </div>

      {/* Health profile status */}
      {hasHealthContext && (
        <div className="mx-4 mb-4 bg-accent/10 border border-accent/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-accent shrink-0" />
          <p className="text-accent text-xs font-medium">Health profile active — answers are personalized to your data</p>
        </div>
      )}

      {profileSaved && (
        <div className="mx-4 mb-4 bg-success/10 border border-success/20 rounded-xl px-4 py-2.5">
          <p className="text-success text-xs font-medium">Health profile saved — your Q&A answers will now be personalized</p>
        </div>
      )}

      {/* Question input */}
      <div className="px-4 mb-4">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-3 flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a health or fitness question…"
            rows={2}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none focus:outline-none"
          />
          <button
            onClick={() => handleAsk(question)}
            disabled={!question.trim() || loading}
            className="bg-accent text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40 shrink-0"
          >
            {loading ? '…' : 'Ask'}
          </button>
        </div>

        {history.length === 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-slate-500 text-xs uppercase tracking-wide">Try asking</p>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleAsk(q)}
                className="w-full text-left text-slate-300 text-sm bg-surface-800/50 rounded-lg px-3 py-2 border border-white/5 hover:border-accent/40 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-4 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="mx-4 bg-surface-800 rounded-xl p-4 animate-pulse space-y-2">
          <div className="h-3 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-5/6" />
          <div className="h-3 bg-white/10 rounded w-2/3" />
        </div>
      )}

      {active && !loading && (
        <div className="mx-4 mb-4 bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-accent text-xs font-medium uppercase tracking-wide mb-1">Question</p>
            <p className="text-white text-sm font-medium">{active.question}</p>
          </div>
          <div className="px-4 py-3 border-t border-white/5">
            <p className="text-accent text-xs font-medium uppercase tracking-wide mb-2">Answer</p>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{active.answer}</p>
          </div>
          {active.citations.length > 0 && (
            <div className="px-4 py-3 border-t border-white/5">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Sources</p>
              <div className="space-y-1">
                {active.citations.map((c, i) => (
                  <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                    className="block text-xs text-accent/80 hover:text-accent truncate">
                    {c.title ?? c.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {history.length > 1 && (
        <div className="px-4">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Recent questions</p>
          <div className="space-y-2">
            {history.filter((h) => h.id !== active?.id).map((entry) => (
              <button key={entry.id} onClick={() => setActiveEntry(entry.id)}
                className="w-full text-left bg-surface-800/60 rounded-xl px-4 py-3 border border-white/5 hover:border-accent/30 transition-colors">
                <p className="text-slate-300 text-sm truncate">{entry.question}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {showGenerateModal && (
        <GenerateProfileModal
          onClose={() => setShowGenerateModal(false)}
          onGenerated={handleProfileGenerated}
        />
      )}
    </div>
  )
}

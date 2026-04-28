import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (mode === 'signin') {
      const { error: err } = await signIn(email, password)
      if (err) setError(err)
    } else {
      const { error: err } = await signUp(email, password)
      if (err) setError(err)
      else setSignupDone(true)
    }
    setLoading(false)
  }

  if (signupDone) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">📬</div>
          <h2 className="text-white font-bold text-lg">Check your email</h2>
          <p className="text-slate-400 text-sm">
            We sent a confirmation link to <span className="text-accent">{email}</span>. Click it to activate your account, then sign in.
          </p>
          <button
            onClick={() => { setMode('signin'); setSignupDone(false) }}
            className="text-accent text-sm underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl">🏋️</div>
          <h1 className="text-white font-bold text-2xl">FitTracker</h1>
          <p className="text-slate-400 text-sm">Your personal life tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-accent text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-accent text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-semibold py-3 rounded-lg disabled:opacity-50 text-sm"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
            className="text-accent underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

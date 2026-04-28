import { Component } from 'react'
import type { ReactNode } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { BottomNav } from './components/layout/BottomNav'
import { TopNav } from './components/layout/TopNav'
import { SettingsModal } from './components/shared/SettingsModal'
import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import TodayPage from './pages/TodayPage'
import WorkoutPage from './pages/WorkoutPage'
import NutritionPage from './pages/NutritionPage'
import ProgressPage from './pages/ProgressPage'
import ProgramPage from './pages/ProgramPage'
import HabitsPage from './pages/HabitsPage'
import HealthPage from './pages/HealthPage'
import BodyPage from './pages/BodyPage'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message + '\n' + e.stack : String(e) }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-red-400 text-xs whitespace-pre-wrap font-mono bg-black min-h-dvh">
          <p className="font-bold text-sm mb-2">App crash — please share this with support:</p>
          {this.state.error}
        </div>
      )
    }
    return this.props.children
  }
}

function AuthGate() {
  const { user, loading, isLocal } = useAuth()
  const [showSettings, setShowSettings] = useState(false)

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    )
  }

  if (!user && !isLocal) return <LoginPage />

  return (
    <div className="min-h-dvh bg-surface-900 pb-20">
      <TopNav />
      <Routes>
        <Route path="/" element={<TodayPage onOpenSettings={() => setShowSettings(true)} />} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/nutrition" element={<NutritionPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/program" element={<ProgramPage />} />
        <Route path="/life" element={<HabitsPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/body" element={<BodyPage />} />
      </Routes>
      <BottomNav />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter>
          <AuthGate />
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

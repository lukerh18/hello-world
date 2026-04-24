import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import { Modal } from './components/shared/Modal'
import { Button } from './components/shared/Button'
import { Input } from './components/shared/Input'
import TodayPage from './pages/TodayPage'
import WorkoutPage from './pages/WorkoutPage'
import NutritionPage from './pages/NutritionPage'
import ProgressPage from './pages/ProgressPage'
import ProgramPage from './pages/ProgramPage'

function OnboardingModal({ onComplete }: { onComplete: (date: string) => void }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)

  return (
    <div className="space-y-4">
      <p className="text-slate-300 text-sm">
        Welcome, <span className="text-accent font-semibold">Luke</span>! Set your program start date
        so your weekly targets and phase are calculated correctly.
      </p>
      <Input
        label="Program Start Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        max={today}
      />
      <Button fullWidth onClick={() => onComplete(date)} disabled={!date}>
        Let's Go 🏋️
      </Button>
    </div>
  )
}

export default function App() {
  const [startDate, setStartDate] = useState<string | null>(() =>
    localStorage.getItem('program_start_date')
  )
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!startDate) setShowOnboarding(true)
  }, [startDate])

  const handleOnboard = (date: string) => {
    localStorage.setItem('program_start_date', date)
    setStartDate(date)
    setShowOnboarding(false)
  }

  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-surface-900 pb-20">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/program" element={<ProgramPage />} />
        </Routes>
        <BottomNav />
      </div>
      <Modal open={showOnboarding} onClose={() => {}} title="Welcome to FitTracker">
        <OnboardingModal onComplete={handleOnboard} />
      </Modal>
    </BrowserRouter>
  )
}

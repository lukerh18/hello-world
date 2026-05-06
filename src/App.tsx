import { Component, useRef, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { AuthProvider, useAuth } from './lib/auth'
import { NutritionLogProvider } from './contexts/NutritionLogContext'
import { BottomNav } from './components/layout/BottomNav'
import { TopNav } from './components/layout/TopNav'
import { SettingsModal } from './components/shared/SettingsModal'
import LoginPage from './pages/LoginPage'
import TodayPage from './pages/TodayPage'
import WorkoutPage from './pages/WorkoutPage'
import NutritionPage from './pages/NutritionPage'
import SupplementsPage from './pages/SupplementsPage'
import ProgressPage from './pages/ProgressPage'
import ProgramPage from './pages/ProgramPage'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  private unhandledErrorListener?: (event: ErrorEvent) => void
  private unhandledRejectionListener?: (event: PromiseRejectionEvent) => void

  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message + '\n' + e.stack : String(e) }
  }
  componentDidMount() {
    this.unhandledErrorListener = (event) => {
      const stack = event.error instanceof Error ? event.error.stack : ''
      this.setState({ error: `${event.message}\n${stack ?? ''}`.trim() })
    }
    this.unhandledRejectionListener = (event) => {
      const reason = event.reason
      const message = reason instanceof Error ? `${reason.message}\n${reason.stack ?? ''}` : String(reason)
      this.setState({ error: `Unhandled promise rejection:\n${message}` })
    }
    window.addEventListener('error', this.unhandledErrorListener)
    window.addEventListener('unhandledrejection', this.unhandledRejectionListener)
  }
  componentWillUnmount() {
    if (this.unhandledErrorListener) {
      window.removeEventListener('error', this.unhandledErrorListener)
    }
    if (this.unhandledRejectionListener) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionListener)
    }
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

const TAB_ROUTES = ['/', '/nutrition', '/workout', '/progress'] as const
type TabRoute = typeof TAB_ROUTES[number]

function SlidingTabs({ onOpenSettings }: { onOpenSettings: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()

  const idx = Math.max(0, (TAB_ROUTES as readonly string[]).indexOf(location.pathname))
  const idxRef = useRef(idx)
  idxRef.current = idx

  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let sx = 0, sy = 0
    let locked: 'h' | 'v' | null = null
    let active = false

    function onStart(e: TouchEvent) {
      sx = e.touches[0].clientX
      sy = e.touches[0].clientY
      locked = null
      active = false
    }

    function onMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - sx
      const dy = e.touches[0].clientY - sy
      if (!locked && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        locked = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v'
      }
      if (locked !== 'h') return
      e.preventDefault()
      active = true
      const i = idxRef.current
      const clamped =
        (i === 0 && dx > 0) || (i === TAB_ROUTES.length - 1 && dx < 0)
          ? dx * 0.25
          : dx
      setDragging(true)
      setOffset(clamped)
    }

    function onEnd(e: TouchEvent) {
      if (!active) return
      const dx = e.changedTouches[0].clientX - sx
      const i = idxRef.current
      setDragging(false)
      setOffset(0)
      const threshold = window.innerWidth * 0.25
      if (dx < -threshold && i < TAB_ROUTES.length - 1) navigate(TAB_ROUTES[i + 1] as TabRoute)
      else if (dx > threshold && i > 0) navigate(TAB_ROUTES[i - 1] as TabRoute)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [navigate])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div
        style={{
          display: 'flex',
          width: `${TAB_ROUTES.length * 100}vw`,
          height: '100%',
          transform: `translateX(calc(${-idx * 100}vw + ${offset}px))`,
          transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
      >
        {[
          <TodayPage onOpenSettings={onOpenSettings} key="today" />,
          <NutritionPage key="nutrition" />,
          <WorkoutPage key="workout" />,
          <ProgressPage key="progress" />,
        ].map((page, i) => (
          <div
            key={TAB_ROUTES[i]}
            style={{ width: '100vw', height: '100%', overflowY: 'auto', flexShrink: 0, paddingBottom: '4.25rem' }}
          >
            {page}
          </div>
        ))}
      </div>
    </div>
  )
}

function AuthGate() {
  const { user, loading } = useAuth()
  const [showSettings, setShowSettings] = useState(false)

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return <AppShell onOpenSettings={() => setShowSettings(true)} showSettings={showSettings} onCloseSettings={() => setShowSettings(false)} />
}

function AppShell({ onOpenSettings, showSettings, onCloseSettings }: {
  onOpenSettings: () => void
  showSettings: boolean
  onCloseSettings: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const isTab = (TAB_ROUTES as readonly string[]).includes(location.pathname)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let removeListener: (() => void) | undefined
    LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const route = event.notification.extra?.route
      if (typeof route === 'string') navigate(route)
    }).then((handle) => {
      removeListener = () => {
        void handle.remove()
      }
    })

    return () => removeListener?.()
  }, [navigate])

  return (
    <div className="fixed inset-0 app-shell bg-surface-900 flex flex-col">
      <TopNav onOpenSettings={onOpenSettings} />
      <div className="relative flex-1 overflow-hidden">
        <SlidingTabs onOpenSettings={onOpenSettings} />
        {!isTab && (
          <div className="absolute inset-0 bg-surface-900 z-10 overflow-y-auto pb-20">
            <Routes>
              <Route path="/supplements" element={<SupplementsPage />} />
              <Route path="/program" element={<ProgramPage />} />
            </Routes>
          </div>
        )}
      </div>
      <BottomNav />
      <SettingsModal open={showSettings} onClose={onCloseSettings} />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NutritionLogProvider>
          <HashRouter>
            <AuthGate />
          </HashRouter>
        </NutritionLogProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

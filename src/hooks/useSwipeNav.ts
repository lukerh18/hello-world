import { useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const TAB_ORDER = ['/', '/workout', '/nutrition']
const SWIPE_THRESHOLD = 60  // min horizontal px to count as a swipe
const ANGLE_RATIO = 2.5     // horizontal must be 2.5× the vertical to avoid scroll conflicts

export function useSwipeNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const startX = useRef(0)
  const startY = useRef(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * ANGLE_RATIO) return

    const idx = TAB_ORDER.indexOf(location.pathname)
    if (idx === -1) return

    if (dx < 0 && idx < TAB_ORDER.length - 1) navigate(TAB_ORDER[idx + 1])
    if (dx > 0 && idx > 0) navigate(TAB_ORDER[idx - 1])
  }, [location.pathname, navigate])

  return { onTouchStart, onTouchEnd }
}

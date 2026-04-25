import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

interface DailyAgendaState {
  date: string
  checkedIds: string[]
  isCheatDay: boolean
}

const EMPTY: DailyAgendaState = { date: '', checkedIds: [], isCheatDay: false }

export function useDailyAgenda() {
  const today = new Date().toISOString().split('T')[0]
  const [stored, setStored] = useLocalStorage<DailyAgendaState>('daily_agenda_v1', EMPTY)

  // Auto-reset on new day
  const state: DailyAgendaState = stored.date === today ? stored : { ...EMPTY, date: today }

  const save = useCallback(
    (updater: (prev: DailyAgendaState) => DailyAgendaState) => {
      setStored((prev) => {
        const current = prev.date === today ? prev : { ...EMPTY, date: today }
        return updater(current)
      })
    },
    [today, setStored]
  )

  const toggleItem = useCallback(
    (id: string) => {
      save((cur) => {
        const has = cur.checkedIds.includes(id)
        return {
          ...cur,
          checkedIds: has ? cur.checkedIds.filter((i) => i !== id) : [...cur.checkedIds, id],
        }
      })
    },
    [save]
  )

  const checkAll = useCallback(
    (ids: string[]) => {
      save((cur) => ({
        ...cur,
        checkedIds: [...new Set([...cur.checkedIds, ...ids])],
      }))
    },
    [save]
  )

  const toggleCheatDay = useCallback(() => {
    save((cur) => ({ ...cur, isCheatDay: !cur.isCheatDay }))
  }, [save])

  return {
    checkedIds: state.checkedIds,
    isCheatDay: state.isCheatDay,
    isChecked: (id: string) => state.checkedIds.includes(id),
    toggleItem,
    checkAll,
    toggleCheatDay,
  }
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppState, ColorKey, Profile, Session } from '../types'
import { todayKey } from './date'

const STORAGE_KEY = 'gym-tracker:v1'

export const DEFAULT_GROUPS = ['Ngực', 'Lưng', 'Vai', 'Tay', 'Chân', 'Mông', 'Bụng', 'Cardio']

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

const emptyState = (): AppState => ({ version: 1, profiles: [], sessions: [], habitLogs: {}, currentProfileId: null })

export function isAppState(x: unknown): x is AppState {
  const s = x as AppState
  return !!s && s.version === 1 && Array.isArray(s.profiles) && Array.isArray(s.sessions) && typeof s.habitLogs === 'object'
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isAppState(parsed)) return parsed
    }
  } catch {
    // storage unavailable or corrupted: start fresh
  }
  return emptyState()
}

interface Store {
  state: AppState
  currentProfile: Profile | null
  addProfile: (name: string, color: ColorKey) => void
  updateProfile: (id: string, patch: Partial<Profile>) => void
  deleteProfile: (id: string) => void
  setCurrentProfile: (id: string | null) => void
  getSession: (profileId: string, date: string) => Session | undefined
  updateSession: (profileId: string, date: string, fn: (s: Session) => Session) => void
  deleteSession: (profileId: string, date: string) => void
  toggleHabit: (profileId: string, date: string, habit: string) => void
  replaceState: (s: AppState) => void
  markBackedUp: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore quota / private mode errors
    }
  }, [state])

  const addProfile = useCallback((name: string, color: ColorKey) => {
    const profile: Profile = { id: uid(), name, color, groups: [...DEFAULT_GROUPS], habits: [], weeklyGoal: 4, customExercises: [] }
    setState((s) => ({ ...s, profiles: [...s.profiles, profile], currentProfileId: profile.id }))
  }, [])

  const updateProfile = useCallback((id: string, patch: Partial<Profile>) => {
    setState((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  }, [])

  const deleteProfile = useCallback((id: string) => {
    setState((s) => {
      const habitLogs = { ...s.habitLogs }
      delete habitLogs[id]
      return {
        ...s,
        profiles: s.profiles.filter((p) => p.id !== id),
        sessions: s.sessions.filter((x) => x.profileId !== id),
        habitLogs,
        currentProfileId: s.currentProfileId === id ? null : s.currentProfileId,
      }
    })
  }, [])

  const setCurrentProfile = useCallback((id: string | null) => {
    setState((s) => ({ ...s, currentProfileId: id }))
  }, [])

  const getSession = useCallback(
    (profileId: string, date: string) => state.sessions.find((x) => x.profileId === profileId && x.date === date),
    [state.sessions],
  )

  const updateSession = useCallback((profileId: string, date: string, fn: (s: Session) => Session) => {
    setState((s) => {
      const existing = s.sessions.find((x) => x.profileId === profileId && x.date === date)
      if (existing) return { ...s, sessions: s.sessions.map((x) => (x === existing ? fn(x) : x)) }
      const fresh: Session = { id: uid(), profileId, date, groups: [], exercises: [] }
      return { ...s, sessions: [...s.sessions, fn(fresh)] }
    })
  }, [])

  const deleteSession = useCallback((profileId: string, date: string) => {
    setState((s) => ({ ...s, sessions: s.sessions.filter((x) => !(x.profileId === profileId && x.date === date)) }))
  }, [])

  const toggleHabit = useCallback((profileId: string, date: string, habit: string) => {
    setState((s) => {
      const byDate = { ...(s.habitLogs[profileId] ?? {}) }
      const list = byDate[date] ?? []
      byDate[date] = list.includes(habit) ? list.filter((h) => h !== habit) : [...list, habit]
      if (!byDate[date].length) delete byDate[date]
      return { ...s, habitLogs: { ...s.habitLogs, [profileId]: byDate } }
    })
  }, [])

  const replaceState = useCallback((next: AppState) => setState(next), [])

  const markBackedUp = useCallback(() => setState((s) => ({ ...s, lastBackupAt: todayKey() })), [])

  const value = useMemo<Store>(
    () => ({
      state,
      currentProfile: state.profiles.find((p) => p.id === state.currentProfileId) ?? null,
      addProfile,
      updateProfile,
      deleteProfile,
      setCurrentProfile,
      getSession,
      updateSession,
      deleteSession,
      toggleHabit,
      replaceState,
      markBackedUp,
    }),
    [state, addProfile, updateProfile, deleteProfile, setCurrentProfile, getSession, updateSession, deleteSession, toggleHabit, replaceState, markBackedUp],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

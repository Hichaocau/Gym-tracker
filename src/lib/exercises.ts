import { EXERCISE_LIBRARY } from '../data/exercises'
import type { ExerciseEntry, ExerciseKind, Profile, Session } from '../types'

export interface ExerciseInfo {
  id: string
  name: string
  en?: string
  group: string
  kind: ExerciseKind
  equipment?: string
  image?: string
  instructions?: string[]
  aliases?: string[]
  custom?: boolean
}

const LIBRARY_BY_ID = new Map<string, ExerciseInfo>(EXERCISE_LIBRARY.map((e) => [e.id, e]))

const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

/** URL of an exercise image: free-exercise-db paths are relative, our own drawings start with "/". */
export const imageUrl = (path: string) => (path.startsWith('/') ? path : IMAGE_BASE + path)

/** The end-position frame next to a start frame ("…/0.jpg" → "…/1.jpg"). */
export const secondImage = (path: string) => path.replace(/0\.(jpg|svg)$/, '1.$1')

export const KIND_LABEL: Record<ExerciseKind, string> = {
  weight: 'Tạ / máy',
  bodyweight: 'Trọng lượng cơ thể',
  time: 'Tính thời gian',
  cardio: 'Cardio',
}

export function allExercises(profile: Profile): ExerciseInfo[] {
  return [...profile.customExercises.map((e) => ({ ...e, custom: true })), ...EXERCISE_LIBRARY]
}

export function findExercise(profile: Profile, id: string): ExerciseInfo {
  const custom = profile.customExercises.find((e) => e.id === id)
  if (custom) return { ...custom, custom: true }
  return LIBRARY_BY_ID.get(id) ?? { id, name: id, group: '', kind: 'weight' }
}

/** Lowercase and strip Vietnamese diacritics so "day nguc" matches "Đẩy ngực". */
export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')

/** Exercise ids this profile has done, most frequent first. */
export function frequentExerciseIds(sessions: Session[], profileId: string): string[] {
  const count = new Map<string, number>()
  for (const s of sessions) {
    if (s.profileId !== profileId) continue
    for (const e of s.exercises) count.set(e.exerciseId, (count.get(e.exerciseId) ?? 0) + 1)
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

/** The most recent entry of an exercise before the given date. */
export function previousEntry(sessions: Session[], profileId: string, exerciseId: string, beforeDate: string) {
  let best: { date: string; entry: ExerciseEntry } | null = null
  for (const s of sessions) {
    if (s.profileId !== profileId || s.date >= beforeDate) continue
    const entry = s.exercises.find((e) => e.exerciseId === exerciseId)
    if (entry && (!best || s.date > best.date)) best = { date: s.date, entry }
  }
  return best
}

/** Sets that have any number entered (empty placeholder rows are ignored). */
export const filledSets = (entry: ExerciseEntry) => entry.sets.filter((s) => s.reps || s.kg || s.seconds)

export const maxKg = (entry: ExerciseEntry) => Math.max(0, ...entry.sets.map((s) => s.kg ?? 0))

const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','))

export const formatSeconds = (sec: number) => (sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : `${sec}s`)

/** Short human summary like "3×10 · 12kg" or "20 phút · 3,2km". */
export function summarizeEntry(entry: ExerciseEntry, kind: ExerciseKind): string {
  if (kind === 'cardio') {
    const parts = []
    if (entry.minutes) parts.push(`${fmtNum(entry.minutes)} phút`)
    if (entry.km) parts.push(`${fmtNum(entry.km)}km`)
    return parts.join(' · ') || 'Chưa nhập'
  }
  const sets = filledSets(entry)
  if (!sets.length) return 'Chưa nhập'
  if (kind === 'time') return `${sets.length} set · ${sets.map((s) => formatSeconds(s.seconds ?? 0)).join(', ')}`
  const reps = sets.map((s) => s.reps ?? 0)
  const sameReps = reps.every((r) => r === reps[0])
  let text = sameReps ? `${sets.length}×${reps[0]}` : `${sets.length} set · ${reps.join('/')}`
  const kg = maxKg(entry)
  if (kg) text += ` · ${fmtNum(kg)}kg`
  return text
}

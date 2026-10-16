import type { Session } from '../types'
import { addDays, addMonths, daysBetween, formatShort, fromKey, hhmmToMin, startOfMonth, startOfWeek, toKey } from './date'

export type Period = 'week' | 'month' | 'year'

export interface Range {
  from: string // inclusive YYYY-MM-DD
  to: string // inclusive
}

export interface Bucket extends Range {
  label: string
}

/** Minutes of a session: from start/end when both are set, otherwise the manual duration. */
export function sessionMinutes(s: Session): number {
  if (s.start && s.end) {
    let diff = hhmmToMin(s.end) - hhmmToMin(s.start)
    if (diff < 0) diff += 24 * 60
    return diff
  }
  return s.durationMin ?? 0
}

export function periodRange(period: Period, anchor: Date): Range {
  if (period === 'week') {
    const from = startOfWeek(anchor)
    return { from: toKey(from), to: toKey(addDays(from, 6)) }
  }
  if (period === 'month') {
    const from = startOfMonth(anchor)
    return { from: toKey(from), to: toKey(addDays(addMonths(from, 1), -1)) }
  }
  return { from: `${anchor.getFullYear()}-01-01`, to: `${anchor.getFullYear()}-12-31` }
}

export function shiftAnchor(period: Period, anchor: Date, n: number): Date {
  if (period === 'week') return addDays(anchor, 7 * n)
  if (period === 'month') return addMonths(anchor, n)
  return new Date(anchor.getFullYear() + n, 0, 1)
}

export function periodTitle(period: Period, anchor: Date): string {
  const r = periodRange(period, anchor)
  if (period === 'week') return `${formatShort(fromKey(r.from))} – ${formatShort(fromKey(r.to))}`
  if (period === 'month') return `Tháng ${anchor.getMonth() + 1}/${anchor.getFullYear()}`
  return `Năm ${anchor.getFullYear()}`
}

/** Chart buckets: days of the week, weeks of the month, or months of the year. */
export function buckets(period: Period, anchor: Date): Bucket[] {
  const r = periodRange(period, anchor)
  if (period === 'week') {
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    return labels.map((label, i) => {
      const d = toKey(addDays(fromKey(r.from), i))
      return { label, from: d, to: d }
    })
  }
  if (period === 'year') {
    return Array.from({ length: 12 }, (_, m) => {
      const from = new Date(anchor.getFullYear(), m, 1)
      return { label: `T${m + 1}`, from: toKey(from), to: toKey(addDays(addMonths(from, 1), -1)) }
    })
  }
  const out: Bucket[] = []
  let weekStart = startOfWeek(fromKey(r.from))
  let i = 1
  while (toKey(weekStart) <= r.to) {
    const from = toKey(weekStart) < r.from ? r.from : toKey(weekStart)
    const end = toKey(addDays(weekStart, 6))
    out.push({ label: `Tuần ${i++}`, from, to: end > r.to ? r.to : end })
    weekStart = addDays(weekStart, 7)
  }
  return out
}

export const inRange = (date: string, r: Range) => date >= r.from && date <= r.to

export const sessionsOf = (sessions: Session[], profileId: string, r?: Range) =>
  sessions.filter((s) => s.profileId === profileId && (!r || inRange(s.date, r)))

export function groupCounts(sessions: Session[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of sessions) for (const g of s.groups) m.set(g, (m.get(g) ?? 0) + 1)
  return m
}

/** Days since each group was last trained (up to `today`). Groups never trained are omitted. */
export function daysSinceGroups(sessions: Session[], today: string): Map<string, number> {
  const last = new Map<string, string>()
  for (const s of sessions) {
    if (s.date > today) continue
    for (const g of s.groups) if (!last.has(g) || s.date > last.get(g)!) last.set(g, s.date)
  }
  const out = new Map<string, number>()
  for (const [g, d] of last) out.set(g, daysBetween(fromKey(d), fromKey(today)))
  return out
}

/** Count of consecutive weeks (ending with last full week, or this week if already met) meeting the goal. */
export function weekGoalStreak(sessions: Session[], goal: number, today: Date): number {
  if (goal <= 0) return 0
  const countIn = (start: Date) => {
    const r = { from: toKey(start), to: toKey(addDays(start, 6)) }
    return sessions.filter((s) => inRange(s.date, r)).length
  }
  let start = startOfWeek(today)
  let streak = countIn(start) >= goal ? 1 : 0
  start = addDays(start, -7)
  while (countIn(start) >= goal) {
    streak++
    start = addDays(start, -7)
  }
  return streak
}

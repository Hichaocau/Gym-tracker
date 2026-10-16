import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { TopBar } from '../components/TopBar'
import { Avatar, Card, IconButton, SectionTitle, Segmented, Stat } from '../components/ui'
import { COLORS } from '../lib/colors'
import { addDays, addMonths, formatDurationShort, formatLong, formatShort, fromKey, startOfMonth, startOfWeek, toKey, todayKey } from '../lib/date'
import { findExercise, summarizeEntry } from '../lib/exercises'
import { groupCounts, periodRange, sessionMinutes, sessionsOf } from '../lib/stats'
import { useStore } from '../lib/store'
import type { Profile, Session } from '../types'

type View = 'week' | 'month'
const VIEW_KEY = 'gym-tracker:calendar-view'
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function loadView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'month' ? 'month' : 'week'
  } catch {
    return 'week'
  }
}

export function CalendarScreen({ profile, onOpenSession }: { profile: Profile; onOpenSession: (date: string) => void }) {
  const [view, setView] = useState<View>(loadView)

  const changeView = (v: View) => {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // remembering the view is only a convenience
    }
  }

  return (
    <>
      <TopBar title="Lịch tập" />
      <div className="mb-4">
        <Segmented
          value={view}
          options={[
            { value: 'week', label: 'Tuần' },
            { value: 'month', label: 'Tháng' },
          ]}
          onChange={changeView}
        />
      </div>
      {view === 'week' ? <WeekView profile={profile} onOpenSession={onOpenSession} /> : <MonthView profile={profile} onOpenSession={onOpenSession} />}
    </>
  )
}

/** One row per day of the week, groups and exercises visible without tapping. */
function WeekView({ profile, onOpenSession }: { profile: Profile; onOpenSession: (date: string) => void }) {
  const { state } = useStore()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const today = todayKey()
  const days = Array.from({ length: 7 }, (_, i) => toKey(addDays(weekStart, i)))
  const range = { from: days[0], to: days[6] }
  const mine = sessionsOf(state.sessions, profile.id, range)
  const minutes = mine.reduce((a, s) => a + sessionMinutes(s), 0)
  const tally = [...groupCounts(mine).entries()].sort((a, b) => b[1] - a[1])
  const others = state.profiles.filter((p) => p.id !== profile.id)
  const isThisWeek = days.includes(today)

  const sessionOf = (p: Profile, date: string) => state.sessions.find((s) => s.profileId === p.id && s.date === date)

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <IconButton label="Tuần trước" onClick={() => setWeekStart(addDays(weekStart, -7))}>
          <ChevronLeft size={20} />
        </IconButton>
        <div className="text-center">
          <div className="font-semibold">{isThisWeek ? 'Tuần này' : `${formatShort(weekStart)} – ${formatShort(addDays(weekStart, 6))}`}</div>
          {isThisWeek && (
            <div className="text-xs text-faint">
              {formatShort(weekStart)} – {formatShort(addDays(weekStart, 6))}
            </div>
          )}
        </div>
        <IconButton label="Tuần sau" onClick={() => setWeekStart(addDays(weekStart, 7))}>
          <ChevronRight size={20} />
        </IconButton>
      </div>


      <div className="space-y-2">
        {days.map((date, i) => {
          const s = sessionOf(profile, date)
          const otherSessions = others.map((p) => ({ p, s: sessionOf(p, date) })).filter((x): x is { p: Profile; s: Session } => !!x.s)
          const isToday = date === today
          return (
            <button
              key={date}
              type="button"
              onClick={() => onOpenSession(date)}
              className={`flex w-full gap-3 rounded-3xl p-3 text-left transition active:scale-[0.99] ${s ? 'bg-card' : 'bg-card/50'} ${isToday ? 'ring-1 ring-accent/60' : ''}`}
            >
              <div className={`flex w-12 shrink-0 flex-col items-center justify-center rounded-2xl py-2 ${s ? 'bg-accent text-bg' : 'bg-card2 text-mute'}`}>
                <span className="text-[11px] font-semibold opacity-80">{WEEKDAYS[i]}</span>
                <span className="tabular text-lg leading-tight font-bold">{fromKey(date).getDate()}</span>
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                {s ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {(s.groups.length ? s.groups : ['Đã tập']).map((g) => (
                        <span key={g} className="rounded-lg bg-accent-soft px-2 py-0.5 text-sm font-semibold text-accent-ink">
                          {g}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1.5 truncate text-xs text-faint">
                      {[
                        s.exercises.length ? s.exercises.map((e) => findExercise(profile, e.exerciseId).name).join(', ') : '',
                        sessionMinutes(s) ? formatDurationShort(sessionMinutes(s)) : '',
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Chưa ghi bài'}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center gap-1.5 text-sm text-faint">
                    {isToday ? (
                      <>
                        <Plus size={15} /> Ghi buổi tập hôm nay
                      </>
                    ) : (
                      'Nghỉ'
                    )}
                  </div>
                )}
                {otherSessions.map(({ p, s: os }) => (
                  <div key={p.id} className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-mute">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[p.color].main }} />
                    <span className="font-semibold" style={{ color: COLORS[p.color].ink }}>
                      {p.name}:
                    </span>
                    <span className="truncate">{os.groups.join(', ') || 'Đã tập'}</span>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <SectionTitle>Tổng kết tuần</SectionTitle>
      <Card>
        <div className="flex items-baseline justify-between">
          <span className="tabular text-2xl font-bold">
            {mine.length}
            <span className="text-base font-medium text-faint"> / {profile.weeklyGoal} buổi</span>
          </span>
          <span className="text-sm text-mute">{minutes ? formatDurationShort(minutes) : ''}</span>
        </div>
        {tally.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tally.map(([g, n]) => (
              <span key={g} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-ink">
                {g} {n > 1 && <span className="opacity-70">×{n}</span>}
              </span>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

/** Month grid with the trained groups written inside each day. */
function MonthView({ profile, onOpenSession }: { profile: Profile; onOpenSession: (date: string) => void }) {
  const { state } = useStore()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(todayKey())
  const today = todayKey()
  const others = state.profiles.filter((p) => p.id !== profile.id)

  const gridStart = startOfWeek(month)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const lastInMonth = cells.findLastIndex((d) => d.getMonth() === month.getMonth())
  const visible = cells.slice(0, Math.ceil((lastInMonth + 1) / 7) * 7)

  const mineByDate = new Map(state.sessions.filter((s) => s.profileId === profile.id).map((s) => [s.date, s]))
  const otherSets = others.map((p) => ({ p, days: new Set(state.sessions.filter((s) => s.profileId === p.id).map((s) => s.date)) }))

  const monthSessions = sessionsOf(state.sessions, profile.id, periodRange('month', month))
  const monthMinutes = monthSessions.reduce((a, s) => a + sessionMinutes(s), 0)

  const daySessions = state.profiles
    .map((p) => ({ p, s: state.sessions.find((x) => x.profileId === p.id && x.date === selected) }))
    .filter((x) => x.s || x.p.id === profile.id)

  return (
    <>
      <Card className="p-2.5 pb-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <IconButton label="Tháng trước" onClick={() => setMonth(addMonths(month, -1))} className="bg-transparent">
            <ChevronLeft size={20} />
          </IconButton>
          <span className="font-semibold">
            Tháng {month.getMonth() + 1}, {month.getFullYear()}
          </span>
          <IconButton label="Tháng sau" onClick={() => setMonth(addMonths(month, 1))} className="bg-transparent">
            <ChevronRight size={20} />
          </IconButton>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-faint">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1">
              {d}
            </div>
          ))}
          {visible.map((d) => {
            const key = toKey(d)
            const inMonth = d.getMonth() === month.getMonth()
            const s = mineByDate.get(key)
            const groups = s?.groups ?? []
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`relative flex min-h-16 flex-col items-center rounded-xl px-0.5 pt-1.5 pb-1 transition active:scale-95 ${
                  s ? 'bg-accent text-bg' : key === today ? 'bg-card2 text-ink' : 'text-mute'
                } ${key === selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-card' : ''} ${inMonth ? '' : 'opacity-30'}`}
              >
                <span className="text-sm leading-none font-bold">{d.getDate()}</span>
                <span className="mt-1 flex w-full flex-col gap-px">
                  {groups.slice(0, 2).map((g) => (
                    <span key={g} className="truncate text-[9px] leading-tight font-semibold">
                      {g}
                    </span>
                  ))}
                  {groups.length > 2 && <span className="text-[9px] leading-tight font-semibold opacity-70">+{groups.length - 2}</span>}
                </span>
                {otherSets.length > 0 && (
                  <span className="absolute top-1 right-1 flex gap-0.5">
                    {otherSets.map(({ p, days }) =>
                      days.has(key) ? <span key={p.id} className="h-1.5 w-1.5 rounded-full" style={{ background: s ? '#0b0c0e' : COLORS[p.color].main }} /> : null,
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {others.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 px-1 text-xs text-mute">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-accent" /> {profile.name}
            </span>
            {others.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[p.color].main }} /> {p.name}
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="Buổi trong tháng" value={monthSessions.length} />
        <Stat label="Tổng thời gian" value={monthMinutes ? formatDurationShort(monthMinutes) : '–'} />
      </div>

      <div className="mt-7 mb-3 px-1 text-[13px] font-semibold tracking-wide text-mute uppercase">{formatLong(fromKey(selected))}</div>
      <div className="space-y-3">
        {daySessions.map(({ p, s }) => {
          const isMe = p.id === profile.id
          return (
            <Card key={p.id} onClick={isMe ? () => onOpenSession(selected) : undefined}>
              <div className="flex items-center gap-3">
                <Avatar profile={p} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-faint">
                    {s ? [s.groups.join(' · ') || 'Đã tập', sessionMinutes(s) ? formatDurationShort(sessionMinutes(s)) : ''].filter(Boolean).join(' — ') : 'Không tập'}
                  </div>
                </div>
                {isMe && !s && (
                  <span className="flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-ink">
                    <Plus size={14} /> Ghi
                  </span>
                )}
                {isMe && s && <ChevronRight size={18} className="text-faint" />}
              </div>
              {s && s.exercises.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-line/70 pt-3">
                  {s.exercises.map((e) => {
                    const info = findExercise(p, e.exerciseId)
                    return (
                      <div key={e.id} className="flex justify-between gap-3 text-sm">
                        <span className="truncate text-mute">{info.name}</span>
                        <span className="tabular shrink-0 font-medium">{summarizeEntry(e, info.kind)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {s?.note && <div className="mt-2 text-sm text-faint italic">“{s.note}”</div>}
            </Card>
          )
        })}
      </div>
    </>
  )
}

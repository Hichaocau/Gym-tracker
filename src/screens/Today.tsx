import { Check, ChevronRight, CloudUpload, Play, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { GroupChips } from '../components/GroupChips'
import { TopBar } from '../components/TopBar'
import { Button, Card, ProgressRing, SectionTitle } from '../components/ui'
import { BACKUP_EVERY_DAYS, daysSinceBackup, exportBackup } from '../lib/backup'
import { addDays, formatDuration, formatLong, hhmmToMin, nowHHMM, startOfWeek, toKey, todayKey } from '../lib/date'
import { filledSets } from '../lib/exercises'
import { daysSinceGroups, sessionMinutes, sessionsOf } from '../lib/stats'
import { useStore } from '../lib/store'
import type { Profile, Session } from '../types'

function useMinuteTick() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20_000)
    return () => clearInterval(id)
  }, [])
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export function Today({ profile, onOpenSession, onStartWorkout }: { profile: Profile; onOpenSession: (date: string) => void; onStartWorkout: () => void }) {
  const { state, getSession, updateSession, deleteSession, toggleHabit } = useStore()
  useMinuteTick()
  const date = todayKey()
  const session = getSession(profile.id, date)
  const habitsToday = state.habitLogs[profile.id]?.[date] ?? []

  const weekStart = startOfWeek(new Date())
  const weekDays = Array.from({ length: 7 }, (_, i) => toKey(addDays(weekStart, i)))
  const weekSessions = sessionsOf(state.sessions, profile.id, { from: weekDays[0], to: weekDays[6] })
  const doneDays = new Set(weekSessions.map((s) => s.date))
  const left = Math.max(0, profile.weeklyGoal - weekSessions.length)

  const mine = sessionsOf(state.sessions, profile.id)
  const since = daysSinceGroups(mine, date)
  const suggestions = mine.length
    ? profile.groups
        .filter((g) => g !== 'Cardio')
        .map((g) => ({ g, d: since.get(g) }))
        .filter(({ d }) => d == null || d >= 4)
        .sort((a, b) => (b.d ?? 999) - (a.d ?? 999))
        .slice(0, 3)
    : []

  return (
    <>
      <TopBar subtitle={formatLong(new Date())} title={`Chào ${profile.name}`} />
      <BackupBanner />

      <StatusCard
        session={session}
        onStart={onStartWorkout}
        onOpen={() => onOpenSession(date)}
        onMarkDone={() => updateSession(profile.id, date, (s) => s)}
        onUnmark={() => {
          if (session && (session.exercises.length || session.note) && !confirm('Xoá buổi tập hôm nay cùng các bài đã ghi?')) return
          deleteSession(profile.id, date)
        }}
      />

      <Card className="mt-3 flex items-center gap-5">
        <ProgressRing value={weekSessions.length} max={profile.weeklyGoal}>
          <span className="tabular text-2xl leading-none font-bold">{weekSessions.length}</span>
          <span className="text-[11px] text-faint">/ {profile.weeklyGoal}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Tuần này</div>
          <div className="text-sm text-mute">{left ? `Còn ${left} buổi để đạt mục tiêu` : 'Đã đạt mục tiêu tuần'}</div>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {weekDays.map((d, i) => (
              <div key={d} className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-7 w-full max-w-7 items-center justify-center rounded-lg ${doneDays.has(d) ? 'bg-accent text-bg' : 'bg-card2'} ${d === date ? 'ring-2 ring-accent/50' : ''}`}
                >
                  {doneDays.has(d) && <Check size={14} strokeWidth={3} />}
                </div>
                <span className={`text-[10px] ${d === date ? 'font-semibold text-ink' : 'text-faint'}`}>{WEEKDAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <SectionTitle>Nhóm cơ hôm nay</SectionTitle>
      <GroupChips profile={profile} date={date} />

      {suggestions.length > 0 && (
        <>
          <SectionTitle>Nên tập</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {suggestions.map(({ g, d }) => (
              <div key={g} className="rounded-2xl bg-card p-3">
                <div className="truncate font-semibold">{g}</div>
                <div className={`text-xs ${d == null || d >= 7 ? 'text-warn' : 'text-faint'}`}>{d == null ? 'Chưa tập' : `${d} ngày trước`}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {profile.habits.length > 0 && (
        <>
          <SectionTitle>Thói quen</SectionTitle>
          <div className="space-y-2">
            {profile.habits.map((h) => {
              const on = habitsToday.includes(h)
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => toggleHabit(profile.id, date, h)}
                  className="flex h-14 w-full items-center justify-between rounded-2xl bg-card px-4 transition active:scale-[0.99]"
                >
                  <span className="font-medium">{h}</span>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${on ? 'bg-accent text-bg' : 'border-2 border-line'}`}>
                    {on && <Check size={16} strokeWidth={3} />}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

function StatusCard({
  session,
  onStart,
  onOpen,
  onMarkDone,
  onUnmark,
}: {
  session?: Session
  onStart: () => void
  onOpen: () => void
  onMarkDone: () => void
  onUnmark: () => void
}) {
  if (!session) {
    return (
      <Card className="p-5">
        <div className="text-lg font-semibold">Hôm nay chưa tập</div>
        <div className="mt-1 text-sm text-mute">Bắt đầu để bấm giờ và ghi bài tập, hoặc chỉ đánh dấu là đã tập.</div>
        <div className="mt-5 grid grid-cols-[1.4fr_1fr] gap-2">
          <Button onClick={onStart}>
            <Play size={18} fill="currentColor" /> Bắt đầu tập
          </Button>
          <Button variant="secondary" onClick={onMarkDone}>
            Đã tập
          </Button>
        </div>
      </Card>
    )
  }

  const running = !!session.start && !session.end
  const minutes = running ? Math.max(0, hhmmToMin(nowHHMM()) - hhmmToMin(session.start!)) : sessionMinutes(session)
  const sets = session.exercises.reduce((a, e) => a + filledSets(e).length, 0)

  return (
    <Card className={`p-5 ${running ? 'bg-accent-soft ring-1 ring-accent/40' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-accent-ink">
          {running ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              Đang tập
            </>
          ) : (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-bg">
                <Check size={13} strokeWidth={3} />
              </span>
              Đã tập hôm nay
            </>
          )}
        </div>
        {!running && (
          <button type="button" onClick={onUnmark} className="text-xs font-medium text-faint">
            Bỏ đánh dấu
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="Thời gian" value={minutes ? formatDuration(minutes) : '–'} />
        <Metric label="Bài tập" value={session.exercises.length || '–'} />
        <Metric label="Set" value={sets || '–'} />
      </div>
      {session.groups.length > 0 && <div className="mt-3 text-sm text-mute">{session.groups.join(' · ')}</div>}

      <Button variant={running ? 'primary' : 'secondary'} className="mt-4 w-full" onClick={onOpen}>
        {running ? 'Tiếp tục buổi tập' : session.exercises.length ? 'Xem và sửa buổi tập' : 'Ghi bài tập, set, rep'}
        <ChevronRight size={18} />
      </Button>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-faint uppercase">{label}</div>
      <div className="tabular mt-0.5 text-lg font-bold">{value}</div>
    </div>
  )
}

const SNOOZE_KEY = 'gym-tracker:backup-snoozed'

/** Monthly nudge to export a backup, since the data only lives on this phone. */
function BackupBanner() {
  const { state, markBackedUp } = useStore()
  const [snoozed, setSnoozed] = useState(() => {
    try {
      return sessionStorage.getItem(SNOOZE_KEY) === todayKey()
    } catch {
      return false
    }
  })
  const days = daysSinceBackup(state)
  if (snoozed || days == null || days < BACKUP_EVERY_DAYS || state.sessions.length < 3) return null

  const snooze = () => {
    setSnoozed(true)
    try {
      sessionStorage.setItem(SNOOZE_KEY, todayKey())
    } catch {
      // snoozing is only for this visit anyway
    }
  }

  return (
    <div className="mb-3 flex items-center gap-3 rounded-3xl bg-warn/10 p-4">
      <CloudUpload size={22} className="shrink-0 text-warn" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-warn">{state.lastBackupAt ? `${days} ngày chưa sao lưu` : 'Chưa sao lưu lần nào'}</div>
        <div className="text-xs text-mute">Dữ liệu chỉ nằm trên máy này.</div>
      </div>
      <button
        type="button"
        onClick={async () => {
          if (await exportBackup(state)) markBackedUp()
        }}
        className="h-9 shrink-0 rounded-xl bg-warn px-3 text-sm font-semibold text-bg"
      >
        Sao lưu
      </button>
      <button type="button" aria-label="Để sau" onClick={snooze} className="-mr-1 shrink-0 p-1 text-faint">
        <X size={16} />
      </button>
    </div>
  )
}

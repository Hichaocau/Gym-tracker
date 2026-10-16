import { ChevronLeft, ChevronRight, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TopBar } from '../components/TopBar'
import { Card, Empty, IconButton, SectionTitle, Segmented, Stat } from '../components/ui'
import { COLORS } from '../lib/colors'
import { addDays, daysBetween, formatDurationShort, formatShort, fromKey, toKey, todayKey } from '../lib/date'
import { findExercise, maxKg } from '../lib/exercises'
import {
  buckets,
  daysSinceGroups,
  groupCounts,
  inRange,
  periodRange,
  periodTitle,
  sessionMinutes,
  sessionsOf,
  shiftAnchor,
  weekGoalStreak,
  type Period,
} from '../lib/stats'
import { useStore } from '../lib/store'
import type { Profile } from '../types'

const ALL = '__all__'
type Metric = 'count' | 'minutes'

const AXIS = { fontSize: 11, fill: '#63646c' }
const tooltipStyle = {
  contentStyle: { background: '#1e1f24', border: 'none', borderRadius: 12, color: '#f4f4f5', fontSize: 13 },
  labelStyle: { color: '#a1a1aa' },
  itemStyle: { color: '#f4f4f5' },
}

export function StatsScreen({ profile }: { profile: Profile }) {
  const { state } = useStore()
  const [scope, setScope] = useState<string>(profile.id)
  const [period, setPeriod] = useState<Period>('month')
  const [anchor, setAnchor] = useState(() => new Date())
  const [metric, setMetric] = useState<Metric>('count')

  const profiles = scope === ALL ? state.profiles : state.profiles.filter((p) => p.id === scope)
  const single = profiles.length === 1 ? profiles[0] : null
  const range = periodRange(period, anchor)
  const today = todayKey()
  const fullPrev = periodRange(period, shiftAnchor(period, anchor, -1))
  // while the period is still running, compare with the same number of days of the previous period
  const prevRange = inRange(today, range)
    ? { from: fullPrev.from, to: [fullPrev.to, toKey(addDays(fromKey(fullPrev.from), daysBetween(fromKey(range.from), fromKey(today))))].sort()[0] }
    : fullPrev

  const perProfile = profiles.map((p) => {
    const ss = sessionsOf(state.sessions, p.id, range)
    const minutes = ss.reduce((a, s) => a + sessionMinutes(s), 0)
    return { p, sessions: ss, count: ss.length, prevCount: sessionsOf(state.sessions, p.id, prevRange).length, minutes }
  })

  const chartData = buckets(period, anchor).map((b) => {
    const row: Record<string, string | number> = { label: b.label.replace('Tuần ', 'T') }
    for (const { p, sessions } of perProfile) {
      const inB = sessions.filter((s) => inRange(s.date, b))
      row[p.id] = metric === 'count' ? inB.length : Math.round((inB.reduce((a, s) => a + sessionMinutes(s), 0) / 60) * 10) / 10
    }
    return row
  })

  const sessionsPerDate = new Map<string, number>()
  for (const s of state.sessions) if (inRange(s.date, range)) sessionsPerDate.set(s.date, (sessionsPerDate.get(s.date) ?? 0) + 1)
  const togetherDays = [...sessionsPerDate.values()].filter((n) => n >= 2).length

  const scopeOptions = [
    ...state.profiles.map((p) => ({ value: p.id, label: p.name })),
    ...(state.profiles.length > 1 ? [{ value: ALL, label: 'Tất cả' }] : []),
  ]

  return (
    <>
      <TopBar title="Thống kê" />
      {scopeOptions.length > 1 && (
        <div className="mb-2">
          <Segmented value={scope} options={scopeOptions} onChange={setScope} />
        </div>
      )}
      <Segmented
        value={period}
        options={[
          { value: 'week', label: 'Tuần' },
          { value: 'month', label: 'Tháng' },
          { value: 'year', label: 'Năm' },
        ]}
        onChange={(v) => {
          setPeriod(v)
          setAnchor(new Date())
        }}
      />
      <div className="my-4 flex items-center justify-between">
        <IconButton label="Kỳ trước" onClick={() => setAnchor(shiftAnchor(period, anchor, -1))}>
          <ChevronLeft size={20} />
        </IconButton>
        <span className="text-lg font-semibold">{periodTitle(period, anchor)}</span>
        <IconButton label="Kỳ sau" onClick={() => setAnchor(shiftAnchor(period, anchor, 1))}>
          <ChevronRight size={20} />
        </IconButton>
      </div>

      {single ? (
        <SingleSummary profile={single} {...perProfile[0]} period={period} partial={inRange(today, range)} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {perProfile.map(({ p, count, minutes }) => (
              <div key={p.id} className="rounded-3xl p-4" style={{ background: COLORS[p.color].soft }}>
                <div className="text-xs font-semibold" style={{ color: COLORS[p.color].ink }}>
                  {p.name}
                </div>
                <div className="tabular mt-1 text-2xl font-bold">{count} buổi</div>
                <div className="text-xs text-mute">{minutes ? formatDurationShort(minutes) : '–'}</div>
              </div>
            ))}
          </div>
          {togetherDays > 0 && <div className="mt-3 rounded-2xl bg-card px-4 py-3 text-sm text-mute">Tập cùng ngày: <span className="font-semibold text-ink">{togetherDays} buổi</span></div>}
        </>
      )}

      <SectionTitle
        action={
          <div className="w-32">
            <Segmented size="sm" value={metric} options={[{ value: 'count', label: 'Buổi' }, { value: 'minutes', label: 'Giờ' }]} onChange={setMetric} />
          </div>
        }
      >
        {period === 'week' ? 'Theo ngày' : period === 'month' ? 'Theo tuần' : 'Theo tháng'}
      </SectionTitle>
      <Card className="px-2 pt-5 pb-2">
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={chartData} margin={{ top: 0, right: 8, left: -28, bottom: 0 }} barGap={3}>
            <CartesianGrid vertical={false} stroke="#25262b" />
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
            <YAxis allowDecimals={metric === 'minutes'} tick={AXIS} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              {...tooltipStyle}
              formatter={(v, id) => [`${v} ${metric === 'count' ? 'buổi' : 'giờ'}`, state.profiles.find((p) => p.id === id)?.name ?? id]}
            />
            {profiles.map((p) => (
              <Bar key={p.id} dataKey={p.id} fill={COLORS[p.color].main} radius={[6, 6, 2, 2]} maxBarSize={26} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <SectionTitle>Nhóm cơ</SectionTitle>
      <GroupBreakdown perProfile={perProfile} />

      {single && range.from <= today && today <= range.to && <Neglected profile={single} />}
      {single && <TopExercises profile={single} range={range} />}
      {single && single.habits.length > 0 && <Habits profile={single} range={range} />}
    </>
  )
}

function SingleSummary({
  profile,
  count,
  prevCount,
  minutes,
  period,
  partial,
}: {
  profile: Profile
  count: number
  prevCount: number
  minutes: number
  period: Period
  partial: boolean
}) {
  const { state } = useStore()
  const diff = count - prevCount
  const prevLabel = (period === 'week' ? 'tuần trước' : period === 'month' ? 'tháng trước' : 'năm trước') + (partial ? ' (cùng kỳ)' : '')
  const streak = weekGoalStreak(sessionsOf(state.sessions, profile.id), profile.weeklyGoal, new Date())
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat
        label="Số buổi"
        value={period === 'week' ? `${count}/${profile.weeklyGoal}` : count}
        hint={diff === 0 ? `bằng ${prevLabel}` : `${diff > 0 ? '+' : ''}${diff} so với ${prevLabel}`}
        tone={diff > 0 ? 'good' : diff < 0 ? 'bad' : undefined}
      />
      <Stat label="Thời gian" value={minutes ? formatDurationShort(minutes) : '–'} hint={count && minutes ? `TB ${formatDurationShort(minutes / count)}/buổi` : undefined} />
      <Stat label="Chuỗi tuần đạt" value={`${streak} tuần`} hint={`mục tiêu ${profile.weeklyGoal} buổi/tuần`} />
      <Stat label="Tổng số bài" value={state.sessions.filter((s) => s.profileId === profile.id).reduce((a, s) => a + s.exercises.length, 0)} hint="từ trước đến nay" />
    </div>
  )
}

function GroupBreakdown({ perProfile }: { perProfile: { p: Profile; sessions: ReturnType<typeof sessionsOf> }[] }) {
  const counts = perProfile.map(({ p, sessions }) => ({ p, m: groupCounts(sessions) }))
  const groups = [...new Set(counts.flatMap(({ m }) => [...m.keys()]))]
  const max = Math.max(1, ...counts.flatMap(({ m }) => [...m.values()]))
  const total = (g: string) => counts.reduce((s, { m }) => s + (m.get(g) ?? 0), 0)
  groups.sort((a, b) => total(b) - total(a))

  if (!groups.length) return <Empty>Chưa có dữ liệu trong kỳ này</Empty>
  return (
    <Card className="space-y-3.5">
      {groups.map((g) => (
        <div key={g} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
          <span className="text-sm font-medium">{g}</span>
          <div className="space-y-1">
            {counts.map(({ p, m }) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card2">
                  <div className="h-full rounded-full" style={{ width: `${((m.get(g) ?? 0) / max) * 100}%`, background: COLORS[p.color].main }} />
                </div>
                <span className="tabular w-5 text-right text-xs font-semibold text-mute">{m.get(g) ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Card>
  )
}

function Neglected({ profile }: { profile: Profile }) {
  const { state } = useStore()
  const mine = sessionsOf(state.sessions, profile.id)
  if (!mine.length) return null
  const since = daysSinceGroups(mine, todayKey())
  const items = profile.groups
    .filter((g) => g !== 'Cardio')
    .map((g) => ({ g, d: since.get(g) }))
    .filter(({ d }) => d == null || d >= 7)
    .sort((a, b) => (b.d ?? 999) - (a.d ?? 999))
  if (!items.length) return null
  return (
    <>
      <SectionTitle>Lâu chưa tập</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {items.map(({ g, d }) => (
          <div key={g} className="flex items-center gap-2 rounded-full bg-warn/10 py-2 pr-3.5 pl-3 text-sm text-warn">
            <TriangleAlert size={15} />
            <span className="font-semibold">{g}</span>
            <span className="opacity-80">{d == null ? 'chưa tập' : `${d} ngày`}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function TopExercises({ profile, range }: { profile: Profile; range: { from: string; to: string } }) {
  const { state } = useStore()
  const [selected, setSelected] = useState<string | null>(null)
  const inPeriod = sessionsOf(state.sessions, profile.id, range)
  const counts = new Map<string, number>()
  for (const s of inPeriod) for (const e of s.exercises) counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1)
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const weighted = top.filter(([id]) => findExercise(profile, id).kind === 'weight')
  const current = selected && counts.has(selected) ? selected : (weighted[0]?.[0] ?? null)

  if (!top.length) return null

  const history = current
    ? sessionsOf(state.sessions, profile.id)
        .filter((s) => s.exercises.some((e) => e.exerciseId === current))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => ({ date: formatShort(fromKey(s.date)), kg: maxKg(s.exercises.find((e) => e.exerciseId === current)!) }))
        .filter((x) => x.kg > 0)
    : []
  const c = COLORS[profile.color]
  const best = history.length ? Math.max(...history.map((h) => h.kg)) : 0

  return (
    <>
      <SectionTitle>Bài tập nhiều nhất</SectionTitle>
      <Card className="p-2">
        {top.map(([id, n]) => {
          const info = findExercise(profile, id)
          const isWeight = info.kind === 'weight'
          const active = id === current
          return (
            <button
              key={id}
              type="button"
              disabled={!isWeight}
              onClick={() => setSelected(id)}
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition ${active ? 'bg-accent-soft' : ''}`}
            >
              <span className={`truncate ${active ? 'font-semibold text-accent-ink' : ''}`}>{info.name}</span>
              <span className="tabular shrink-0 pl-3 text-faint">{n} lần</span>
            </button>
          )
        })}
      </Card>
      {current && history.length > 0 && (
        <>
          <SectionTitle>Tiến bộ mức tạ</SectionTitle>
          <Card className="px-2 pt-4 pb-2">
            <div className="mb-3 flex items-baseline justify-between px-3">
              <span className="truncate font-semibold">{findExercise(profile, current).name}</span>
              <span className="tabular shrink-0 pl-3 text-sm text-mute">
                Cao nhất <span className="font-bold text-accent-ink">{String(best).replace('.', ',')} kg</span>
              </span>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={history} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#25262b" />
                <XAxis dataKey="date" tick={AXIS} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} domain={['auto', 'auto']} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${String(v).replace('.', ',')} kg`, 'Mức tạ']} />
                <Line type="monotone" dataKey="kg" stroke={c.main} strokeWidth={2.5} dot={{ r: 3, fill: c.main, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </>
  )
}

function Habits({ profile, range }: { profile: Profile; range: { from: string; to: string } }) {
  const { state } = useStore()
  const logs = state.habitLogs[profile.id] ?? {}
  return (
    <>
      <SectionTitle>Thói quen</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {profile.habits.map((h) => (
          <Stat key={h} label={h} value={`${Object.entries(logs).filter(([d, list]) => inRange(d, range) && list.includes(h)).length} ngày`} />
        ))}
      </div>
    </>
  )
}

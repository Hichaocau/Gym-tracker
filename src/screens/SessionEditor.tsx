import { ChevronDown, Plus, Timer, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ExerciseCard } from '../components/ExerciseCard'
import { GroupChips } from '../components/GroupChips'
import { NumInput } from '../components/NumInput'
import { Button, Card, Screen, SectionTitle } from '../components/ui'
import { formatDuration, formatLong, fromKey, hhmmToMin, nowHHMM, todayKey } from '../lib/date'
import { findExercise, previousEntry } from '../lib/exercises'
import { sessionMinutes } from '../lib/stats'
import { uid, useStore } from '../lib/store'
import type { ExerciseEntry, Profile, Session } from '../types'
import { ExercisePicker } from './ExercisePicker'

function useSecondTick(active: boolean) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [active])
}

/** "1:05:09" style elapsed time since an HH:MM start today. */
function elapsedSince(start: string) {
  const now = new Date()
  const [h, m] = start.split(':').map(Number)
  let sec = Math.floor((now.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime()) / 1000)
  if (sec < 0) sec += 86_400
  const hh = Math.floor(sec / 3600)
  const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  return hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`
}

export function SessionEditor({ profile, date, onClose }: { profile: Profile; date: string; onClose: () => void }) {
  const { state, getSession, updateSession, deleteSession } = useStore()
  const [picking, setPicking] = useState(false)
  const session = getSession(profile.id, date)
  const running = !!session?.start && !session.end && date === todayKey()
  useSecondTick(running)

  const update = (fn: (s: Session) => Session) => updateSession(profile.id, date, fn)

  const addExercises = (ids: string[]) => {
    const entries: ExerciseEntry[] = ids.map((exerciseId) => {
      const prev = previousEntry(state.sessions, profile.id, exerciseId, date)
      const kind = findExercise(profile, exerciseId).kind
      // empty rows; last time's numbers show as hints and fill in when a set is ticked
      const count = prev?.entry.sets.length || (kind === 'cardio' ? 0 : kind === 'time' ? 2 : 3)
      return { id: uid(), exerciseId, sets: Array.from({ length: count }, () => ({})) }
    })
    update((s) => {
      const groups = [...s.groups]
      for (const id of ids) {
        const g = findExercise(profile, id).group
        if (g && profile.groups.includes(g) && !groups.includes(g)) groups.push(g)
      }
      return { ...s, groups, exercises: [...s.exercises, ...entries] }
    })
    setPicking(false)
  }

  const finish = () => {
    if (running) update((s) => ({ ...s, end: nowHHMM() }))
    onClose()
  }

  const remove = () => {
    if (!confirm('Xoá toàn bộ buổi tập này?')) return
    deleteSession(profile.id, date)
    onClose()
  }

  if (picking) {
    return (
      <ExercisePicker
        profile={profile}
        sessionGroups={session?.groups ?? []}
        existingIds={session?.exercises.map((e) => e.exerciseId) ?? []}
        onAdd={addExercises}
        onClose={() => setPicking(false)}
      />
    )
  }

  const minutes = session ? sessionMinutes(session) : 0
  const doneSets = session?.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0) ?? 0
  const totalSets = session?.exercises.reduce((a, e) => a + e.sets.length, 0) ?? 0

  return (
    <Screen
      header={
        <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-3">
          <button type="button" onClick={onClose} aria-label="Thu nhỏ" className="flex h-10 w-10 items-center justify-center rounded-full active:bg-card">
            <ChevronDown size={24} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold">{date === todayKey() ? 'Buổi tập hôm nay' : 'Buổi tập'}</div>
            <div className="truncate text-xs text-faint">
              {profile.name} · {formatLong(fromKey(date))}
            </div>
          </div>
          {running ? (
            <div className="tabular flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-bold text-accent-ink">
              <Timer size={15} /> {elapsedSince(session!.start!)}
            </div>
          ) : minutes > 0 ? (
            <div className="rounded-full bg-card px-3 py-1.5 text-sm font-semibold text-mute">{formatDuration(minutes)}</div>
          ) : null}
        </div>
      }
      footer={
        <Button className="w-full" onClick={finish}>
          {running ? 'Kết thúc buổi tập' : 'Xong'}
        </Button>
      }
    >
      {totalSets > 0 && (
        <div className="mb-4">
          <div className="mb-1.5 flex justify-between text-xs font-medium text-faint">
            <span>Tiến độ</span>
            <span className="tabular">
              {doneSets}/{totalSets} set
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-card">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(doneSets / totalSets) * 100}%` }} />
          </div>
        </div>
      )}

      <GroupChips profile={profile} date={date} scroll />

      <div className="mt-4 space-y-3">
        {session?.exercises.map((e) => (
          <ExerciseCard
            key={e.id}
            profile={profile}
            date={date}
            entry={e}
            onChange={(next) => update((s) => ({ ...s, exercises: s.exercises.map((x) => (x.id === e.id ? next : x)) }))}
            onRemove={() => update((s) => ({ ...s, exercises: s.exercises.filter((x) => x.id !== e.id) }))}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPicking(true)}
        className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line font-semibold text-accent-ink transition active:scale-[0.99]"
      >
        <Plus size={20} /> Thêm bài tập
      </button>

      <SectionTitle>Thời gian</SectionTitle>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <TimeField label="Bắt đầu" value={session?.start} onChange={(v) => update((s) => ({ ...s, start: v }))} />
          <TimeField label="Kết thúc" value={session?.end} onChange={(v) => update((s) => ({ ...s, end: v }))} />
        </div>
        {!(session?.start && session?.end) && !running && (
          <label className="mt-4 block text-xs font-medium text-faint">
            Hoặc nhập tổng số phút
            <NumInput value={session?.durationMin} onChange={(v) => update((s) => ({ ...s, durationMin: v }))} placeholder="60" className="mt-1.5 h-11" />
          </label>
        )}
        {session?.start && session.end && hhmmToMin(session.end) < hhmmToMin(session.start) && (
          <p className="mt-3 text-xs text-warn">Giờ kết thúc sớm hơn giờ bắt đầu, app tính là qua nửa đêm.</p>
        )}
      </Card>

      <SectionTitle>Ghi chú</SectionTitle>
      <textarea
        value={session?.note ?? ''}
        onChange={(e) => update((s) => ({ ...s, note: e.target.value || undefined }))}
        placeholder="Cảm giác hôm nay, chấn thương, kỷ lục mới…"
        rows={3}
        className="w-full resize-none rounded-3xl bg-card px-4 py-3 text-[15px] outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/50"
      />

      {session && (
        <button type="button" onClick={remove} className="mt-8 flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-bad">
          <Trash2 size={16} /> Xoá buổi tập
        </button>
      )}
    </Screen>
  )
}

function TimeField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string | undefined) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-faint">
        {label}
        <button type="button" onClick={() => onChange(nowHHMM())} className="font-semibold text-accent-ink">
          Bây giờ
        </button>
      </div>
      <input
        type="time"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="tabular mt-1.5 h-11 w-full rounded-xl bg-card2 px-3 font-semibold outline-none focus:ring-2 focus:ring-accent/50"
      />
    </div>
  )
}

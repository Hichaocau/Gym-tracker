import { Check, Minus, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { formatShort, fromKey } from '../lib/date'
import { findExercise, formatSeconds, imageUrl, maxKg, previousEntry, summarizeEntry } from '../lib/exercises'
import { useStore } from '../lib/store'
import type { ExerciseEntry, Profile, SetEntry } from '../types'
import { ExerciseInfoSheet } from './ExerciseInfoSheet'
import { NumInput } from './NumInput'

const fmt = (n?: number) => (n == null ? '' : String(n).replace('.', ','))

export function ExerciseCard({
  profile,
  date,
  entry,
  onChange,
  onRemove,
}: {
  profile: Profile
  date: string
  entry: ExerciseEntry
  onChange: (e: ExerciseEntry) => void
  onRemove: () => void
}) {
  const { state } = useStore()
  const [showInfo, setShowInfo] = useState(false)
  const info = findExercise(profile, entry.exerciseId)
  const prev = previousEntry(state.sessions, profile.id, entry.exerciseId, date)
  const timed = info.kind === 'time'

  /** Suggested values for set i: same set last time, else the row above. */
  const hint = (i: number): SetEntry => prev?.entry.sets[i] ?? entry.sets[i - 1] ?? prev?.entry.sets.at(-1) ?? {}

  const setSet = (i: number, patch: Partial<SetEntry>) => onChange({ ...entry, sets: entry.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) })
  const toggleDone = (i: number) => {
    const s = entry.sets[i]
    if (s.done) return setSet(i, { done: false })
    const h = hint(i)
    // ticking an empty row accepts the suggested numbers
    setSet(i, timed ? { done: true, seconds: s.seconds ?? h.seconds } : { done: true, reps: s.reps ?? h.reps, kg: s.kg ?? h.kg })
  }

  const kgDiff = prev && info.kind === 'weight' && maxKg(entry) > 0 ? maxKg(entry) - maxKg(prev.entry) : 0

  return (
    <div className="rounded-3xl bg-card p-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setShowInfo(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <Thumb image={info.image} name={info.name} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-accent-ink">{info.name}</div>
            <div className="truncate text-xs text-faint">{prev ? `Lần trước ${formatShort(fromKey(prev.date))} · ${summarizeEntry(prev.entry, info.kind)}` : 'Lần đầu tập bài này'}</div>
          </div>
        </button>
        <button type="button" onClick={onRemove} aria-label="Xoá bài" className="flex h-9 w-9 items-center justify-center rounded-full text-faint active:bg-card2">
          <Trash2 size={17} />
        </button>
      </div>

      {info.kind === 'cardio' ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-faint">
            PHÚT
            <NumInput value={entry.minutes} onChange={(v) => onChange({ ...entry, minutes: v })} placeholder={fmt(prev?.entry.minutes) || '0'} className="mt-1 h-12 text-lg" />
          </label>
          <label className="text-xs font-medium text-faint">
            KM
            <NumInput value={entry.km} onChange={(v) => onChange({ ...entry, km: v })} placeholder={fmt(prev?.entry.km) || '0'} className="mt-1 h-12 text-lg" />
          </label>
        </div>
      ) : (
        <>
          <div className={`mt-4 grid items-center gap-x-2 gap-y-1.5 ${timed ? 'grid-cols-[2rem_1fr_1fr_2.5rem]' : 'grid-cols-[2rem_1fr_1fr_1fr_2.5rem]'}`}>
            <span className="text-center text-[11px] font-semibold text-faint">SET</span>
            <span className="text-center text-[11px] font-semibold text-faint">TRƯỚC</span>
            {timed ? (
              <span className="text-center text-[11px] font-semibold text-faint">GIÂY</span>
            ) : (
              <>
                <span className="text-center text-[11px] font-semibold text-faint">{info.kind === 'bodyweight' ? '+KG' : 'KG'}</span>
                <span className="text-center text-[11px] font-semibold text-faint">REP</span>
              </>
            )}
            <span />
            {entry.sets.map((s, i) => {
              const h = hint(i)
              const p = prev?.entry.sets[i]
              return (
                <Row key={i} done={s.done}>
                  <span className={`flex h-10 items-center justify-center rounded-xl text-sm font-bold ${s.done ? 'text-accent-ink' : 'text-mute'}`}>{i + 1}</span>
                  <span className="tabular truncate text-center text-xs text-faint">
                    {p ? (timed ? formatSeconds(p.seconds ?? 0) : `${p.kg ? fmt(p.kg) + '×' : ''}${p.reps ?? ''}`) : '–'}
                  </span>
                  {timed ? (
                    <NumInput ariaLabel={`Giây set ${i + 1}`} value={s.seconds} onChange={(v) => setSet(i, { seconds: v })} placeholder={fmt(h.seconds) || '60'} className={s.done ? 'bg-transparent' : ''} />
                  ) : (
                    <>
                      <NumInput ariaLabel={`Kg set ${i + 1}`} value={s.kg} onChange={(v) => setSet(i, { kg: v })} placeholder={fmt(h.kg) || (info.kind === 'bodyweight' ? '0' : 'kg')} className={s.done ? 'bg-transparent' : ''} />
                      <NumInput ariaLabel={`Rep set ${i + 1}`} value={s.reps} onChange={(v) => setSet(i, { reps: v })} placeholder={fmt(h.reps) || '10'} className={s.done ? 'bg-transparent' : ''} />
                    </>
                  )}
                  <button
                    type="button"
                    aria-label={`Xong set ${i + 1}`}
                    onClick={() => toggleDone(i)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-90 ${s.done ? 'bg-accent text-bg' : 'bg-card2 text-faint'}`}
                  >
                    <Check size={18} strokeWidth={3} />
                  </button>
                </Row>
              )
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...entry, sets: [...entry.sets, {}] })}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-card2 text-sm font-semibold transition active:scale-[0.98]"
            >
              <Plus size={16} /> Thêm set
            </button>
            {entry.sets.length > 0 && (
              <button
                type="button"
                aria-label="Bớt set cuối"
                onClick={() => onChange({ ...entry, sets: entry.sets.slice(0, -1) })}
                className="flex h-10 w-12 items-center justify-center rounded-xl bg-card2 text-mute transition active:scale-95"
              >
                <Minus size={16} />
              </button>
            )}
          </div>
          {kgDiff !== 0 && (
            <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${kgDiff > 0 ? 'text-good' : 'text-faint'}`}>
              {kgDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {kgDiff > 0 ? '+' : ''}
              {Math.round(kgDiff * 10) / 10} kg so với lần trước
            </div>
          )}
        </>
      )}
      {showInfo && <ExerciseInfoSheet exercise={info} onClose={() => setShowInfo(false)} />}
    </div>
  )
}

/** One table row; subgrid keeps the parent's columns while allowing a row highlight. */
function Row({ done, children }: { done?: boolean; children: ReactNode }) {
  return (
    <div className={`col-span-full grid grid-cols-subgrid items-center rounded-xl py-0.5 transition ${done ? 'bg-accent-soft' : ''}`}>{children}</div>
  )
}

export function Thumb({ image, name, size = 44 }: { image?: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card2 text-sm font-bold text-faint" style={{ width: size, height: size }}>
      {image && !failed ? (
        <img src={imageUrl(image)} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover opacity-90" />
      ) : (
        name.charAt(0)
      )}
    </div>
  )
}

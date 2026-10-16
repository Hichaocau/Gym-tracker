import { Check, Info, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ExerciseInfoSheet } from '../components/ExerciseInfoSheet'
import { Thumb } from '../components/ExerciseCard'
import { Button, Chip, Screen, Sheet } from '../components/ui'
import { allExercises, frequentExerciseIds, KIND_LABEL, normalize, type ExerciseInfo } from '../lib/exercises'
import { uid, useStore } from '../lib/store'
import type { ExerciseKind, Profile } from '../types'

const ALL = '__all__'

export function ExercisePicker({
  profile,
  sessionGroups,
  existingIds,
  onAdd,
  onClose,
}: {
  profile: Profile
  sessionGroups: string[]
  existingIds: string[]
  onAdd: (ids: string[]) => void
  onClose: () => void
}) {
  const { state, updateProfile } = useStore()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState(sessionGroups[0] ?? ALL)
  const [picked, setPicked] = useState<string[]>([])
  const [info, setInfo] = useState<ExerciseInfo | null>(null)
  const [creating, setCreating] = useState(false)

  const exercises = allExercises(profile)
  const frequent = frequentExerciseIds(state.sessions, profile.id)
  const filterGroups = [...sessionGroups, ...profile.groups.filter((g) => !sessionGroups.includes(g))]

  const matches = useMemo(() => {
    const q = normalize(query.trim())
    return exercises.filter((e) => {
      if (q) return [e.name, e.en ?? '', ...(e.aliases ?? [])].some((t) => normalize(t).includes(q))
      return group === ALL || e.group === group
    })
  }, [exercises, query, group])

  const frequentMatches = frequent.map((id) => matches.find((e) => e.id === id)).filter((e): e is ExerciseInfo => !!e)
  const rest = matches.filter((e) => !frequent.includes(e.id))

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const row = (e: ExerciseInfo) => {
    const already = existingIds.includes(e.id)
    const on = picked.includes(e.id)
    return (
      <div key={e.id} className={`flex items-center gap-1 rounded-2xl pr-1 transition ${on ? 'bg-accent-soft' : ''}`}>
        <button type="button" disabled={already} onClick={() => toggle(e.id)} className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left disabled:opacity-35">
          <Thumb image={e.image} name={e.name} size={48} />
          <span className="min-w-0 flex-1">
            <span className={`block truncate font-medium ${on ? 'text-accent-ink' : ''}`}>{e.name}</span>
            <span className="block truncate text-xs text-faint">{already ? 'Đã có trong buổi tập' : [e.equipment, e.custom ? 'Bài tự thêm' : e.en].filter(Boolean).join(' · ')}</span>
          </span>
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${on ? 'bg-accent text-bg' : 'border-2 border-line'}`}>
            {on && <Check size={14} strokeWidth={3} />}
          </span>
        </button>
        <button type="button" aria-label={`Hướng dẫn ${e.name}`} onClick={() => setInfo(e)} className="flex h-10 w-9 items-center justify-center text-faint">
          <Info size={18} />
        </button>
      </div>
    )
  }

  return (
    <Screen
      header={
        <div className="mx-auto max-w-md px-4 pt-2 pb-3">
          <div className="flex h-12 items-center gap-2">
            <button type="button" onClick={onClose} aria-label="Đóng" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full active:bg-card">
              <X size={22} />
            </button>
            <h1 className="flex-1 text-[17px] font-semibold">Chọn bài tập</h1>
            <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-1 text-sm font-semibold text-accent-ink">
              <Plus size={16} /> Bài mới
            </button>
          </div>
          <div className="mt-1 flex h-11 items-center gap-2 rounded-2xl bg-card px-3.5">
            <Search size={18} className="text-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm: đẩy ngực, squat, curl…" className="w-full bg-transparent outline-none placeholder:text-faint" />
            {query && (
              <button type="button" aria-label="Xoá tìm kiếm" onClick={() => setQuery('')} className="text-faint">
                <X size={16} />
              </button>
            )}
          </div>
          {!query && (
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
              {filterGroups.map((g) => (
                <Chip key={g} active={group === g} onClick={() => setGroup(g)}>
                  {g}
                </Chip>
              ))}
              <Chip active={group === ALL} onClick={() => setGroup(ALL)}>
                Tất cả
              </Chip>
            </div>
          )}
        </div>
      }
      footer={
        <Button className="w-full" disabled={!picked.length} onClick={() => onAdd(picked)}>
          {picked.length ? `Thêm ${picked.length} bài` : 'Chọn bài để thêm'}
        </Button>
      }
    >
      {frequentMatches.length > 0 && (
        <>
          <div className="mb-1 px-2 text-xs font-semibold tracking-wide text-faint uppercase">Hay tập</div>
          <div className="mb-5">{frequentMatches.map(row)}</div>
        </>
      )}
      <div className="mb-1 px-2 text-xs font-semibold tracking-wide text-faint uppercase">
        {query ? 'Kết quả' : 'Thư viện'} · {rest.length}
      </div>
      {rest.length ? (
        <div>{rest.map(row)}</div>
      ) : (
        <div className="py-10 text-center text-sm text-faint">
          Không tìm thấy bài nào.
          <br />
          <button type="button" onClick={() => setCreating(true)} className="mt-3 font-semibold text-accent-ink">
            Tự thêm “{query}”
          </button>
        </div>
      )}

      {info && <ExerciseInfoSheet exercise={info} onClose={() => setInfo(null)} />}
      {creating && (
        <CustomExerciseSheet
          profile={profile}
          defaultGroup={group === ALL ? (sessionGroups[0] ?? profile.groups[0] ?? '') : group}
          defaultName={query}
          onClose={() => setCreating(false)}
          onCreate={(ex) => {
            updateProfile(profile.id, { customExercises: [...profile.customExercises, ex] })
            setPicked((p) => [...p, ex.id])
            setQuery('')
            setGroup(ex.group)
            setCreating(false)
          }}
        />
      )}
    </Screen>
  )
}

function CustomExerciseSheet({
  profile,
  defaultGroup,
  defaultName,
  onCreate,
  onClose,
}: {
  profile: Profile
  defaultGroup: string
  defaultName: string
  onCreate: (e: { id: string; name: string; group: string; kind: ExerciseKind }) => void
  onClose: () => void
}) {
  const [name, setName] = useState(defaultName)
  const [group, setGroup] = useState(defaultGroup)
  const [kind, setKind] = useState<ExerciseKind>('weight')

  return (
    <Sheet title="Bài tập mới" onClose={onClose}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tên bài tập"
        className="h-12 w-full rounded-2xl bg-card2 px-4 text-[15px] font-medium outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/50"
      />
      <div className="mt-5 mb-2 text-xs font-semibold text-faint uppercase">Nhóm cơ</div>
      <div className="flex flex-wrap gap-2">
        {profile.groups.map((g) => (
          <Chip key={g} active={group === g} onClick={() => setGroup(g)}>
            {g}
          </Chip>
        ))}
      </div>
      <div className="mt-5 mb-2 text-xs font-semibold text-faint uppercase">Cách ghi</div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(KIND_LABEL) as ExerciseKind[]).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {KIND_LABEL[k]}
          </Chip>
        ))}
      </div>
      <Button className="mt-6 mb-2 w-full" disabled={!name.trim()} onClick={() => onCreate({ id: 'custom-' + uid(), name: name.trim(), group, kind })}>
        Lưu và chọn bài này
      </Button>
    </Sheet>
  )
}

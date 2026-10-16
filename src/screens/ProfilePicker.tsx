import { Dumbbell, Plus } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../components/ui'
import { COLOR_KEYS, COLORS, ON_ACCENT } from '../lib/colors'
import { useStore } from '../lib/store'
import type { ColorKey } from '../types'

export function ProfilePicker() {
  const { state, addProfile, setCurrentProfile } = useStore()
  const [adding, setAdding] = useState(state.profiles.length === 0)
  const [name, setName] = useState('')
  const usedColors = new Set(state.profiles.map((p) => p.color))
  const [color, setColor] = useState<ColorKey>(COLOR_KEYS.find((c) => !usedColors.has(c)) ?? 'teal')
  const first = state.profiles.length === 0

  const submit = () => {
    if (!name.trim()) return
    addProfile(name.trim(), color)
  }

  return (
    <div className="anim-fade mx-auto flex min-h-screen max-w-md flex-col items-center px-6 pt-[max(env(safe-area-inset-top),48px)] pb-10">
      <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-[22px] bg-card">
        <Dumbbell size={30} style={{ color: adding ? COLORS[color].main : '#f4f4f5' }} />
      </div>
      <h1 className="mt-6 text-center text-[28px] font-bold tracking-tight">{first ? 'Gym Tracker' : 'Ai đang tập?'}</h1>
      <p className="mt-2 text-center text-mute">{first ? 'Tạo hồ sơ đầu tiên để bắt đầu ghi buổi tập.' : 'Chọn hồ sơ của bạn'}</p>

      {!first && (
        <div className="mt-10 grid w-full grid-cols-2 gap-3">
          {state.profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setCurrentProfile(p.id)}
              className="flex flex-col items-center gap-3 rounded-3xl bg-card py-6 transition active:scale-95"
            >
              <Avatar profile={p} size={72} ring={p.id === state.currentProfileId} />
              <span className="font-semibold">{p.name}</span>
            </button>
          ))}
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-line py-6 text-faint transition active:scale-95"
            >
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-card">
                <Plus size={28} />
              </span>
              <span className="font-medium">Thêm người</span>
            </button>
          )}
        </div>
      )}

      {adding && (
        <div className="mt-10 w-full rounded-3xl bg-card p-5">
          <label className="text-sm font-medium text-mute" htmlFor="profile-name">
            Tên
          </label>
          <input
            id="profile-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Đạt"
            className="mt-2 h-12 w-full rounded-2xl bg-card2 px-4 text-lg font-medium outline-none placeholder:text-faint focus:ring-2"
            style={{ ['--tw-ring-color' as string]: COLORS[color].main }}
          />
          <div className="mt-5 text-sm font-medium text-mute">Màu của bạn</div>
          <div className="mt-3 flex justify-between">
            {COLOR_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setColor(c)}
                className="h-10 w-10 rounded-full transition active:scale-90"
                style={{ background: COLORS[c].main, boxShadow: c === color ? `0 0 0 3px #15161a, 0 0 0 5px ${COLORS[c].main}` : undefined }}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={submit}
            className="mt-6 h-12 w-full rounded-2xl font-semibold transition active:scale-[0.98] disabled:opacity-35"
            style={{ background: COLORS[color].main, color: ON_ACCENT }}
          >
            Tạo hồ sơ
          </button>
          {!first && (
            <button type="button" className="mt-2 h-11 w-full text-sm font-medium text-mute" onClick={() => setAdding(false)}>
              Huỷ
            </button>
          )}
        </div>
      )}
    </div>
  )
}

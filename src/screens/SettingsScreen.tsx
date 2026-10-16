import { ChevronRight, Download, Minus, Plus, Trash2, Upload, Users, X } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { TopBar } from '../components/TopBar'
import { Avatar, Card, SectionTitle } from '../components/ui'
import { COLOR_KEYS, COLORS } from '../lib/colors'
import { exportBackup } from '../lib/backup'
import { formatShort, fromKey } from '../lib/date'
import { isAppState, useStore } from '../lib/store'
import type { Profile } from '../types'

export function SettingsScreen({ profile }: { profile: Profile }) {
  const { state, updateProfile, deleteProfile, setCurrentProfile, replaceState, markBackedUp } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  const exportData = async () => {
    if (await exportBackup(state)) {
      markBackedUp()
      setMessage('Đã tạo file sao lưu')
    }
  }

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text())
      if (!isAppState(parsed)) throw new Error('invalid')
      if (!confirm(`Thay toàn bộ dữ liệu hiện tại bằng file này (${parsed.profiles.length} người, ${parsed.sessions.length} buổi tập)?`)) return
      replaceState(parsed)
      setMessage('Đã nhập dữ liệu')
    } catch {
      setMessage('File không hợp lệ. Hãy chọn file xuất từ app này.')
    }
  }

  return (
    <>
      <TopBar title="Cài đặt" />

      <Card className="flex items-center gap-4 p-5">
        <Avatar profile={profile} size={56} />
        <input
          value={profile.name}
          onChange={(e) => updateProfile(profile.id, { name: e.target.value })}
          aria-label="Tên"
          className="min-w-0 flex-1 rounded-xl bg-transparent px-2 py-1 text-xl font-bold outline-none focus:bg-card2"
        />
      </Card>

      <SectionTitle>Hồ sơ</SectionTitle>
      <Card className="divide-y divide-line/70 p-0">
        <Row label="Màu">
          <div className="flex gap-2">
            {COLOR_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => updateProfile(profile.id, { color: c })}
                className="h-7 w-7 rounded-full transition active:scale-90"
                style={{ background: COLORS[c].main, boxShadow: c === profile.color ? `0 0 0 2px #15161a, 0 0 0 4px ${COLORS[c].main}` : undefined }}
              />
            ))}
          </div>
        </Row>
        <Row label="Mục tiêu tuần">
          <div className="flex items-center gap-1">
            <Stepper label="Giảm" onClick={() => updateProfile(profile.id, { weeklyGoal: Math.max(1, profile.weeklyGoal - 1) })}>
              <Minus size={16} />
            </Stepper>
            <span className="tabular w-16 text-center font-semibold">{profile.weeklyGoal} buổi</span>
            <Stepper label="Tăng" onClick={() => updateProfile(profile.id, { weeklyGoal: Math.min(14, profile.weeklyGoal + 1) })}>
              <Plus size={16} />
            </Stepper>
          </div>
        </Row>
      </Card>

      <SectionTitle>Nhóm cơ</SectionTitle>
      <EditableList items={profile.groups} placeholder="Thêm nhóm cơ, vd: Cẳng tay" onChange={(groups) => updateProfile(profile.id, { groups })} />

      <SectionTitle>Thói quen hằng ngày</SectionTitle>
      <EditableList items={profile.habits} placeholder="Thêm thói quen, vd: Uống đủ nước" onChange={(habits) => updateProfile(profile.id, { habits })} />

      {profile.customExercises.length > 0 && (
        <>
          <SectionTitle>Bài tập tự thêm</SectionTitle>
          <Card className="divide-y divide-line/70 p-0">
            {profile.customExercises.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-faint">{e.group}</div>
                </div>
                <button
                  type="button"
                  aria-label={`Xoá ${e.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-faint active:bg-card2"
                  onClick={() => {
                    const used = state.sessions.some((s) => s.exercises.some((x) => x.exerciseId === e.id))
                    if (used && !confirm('Bài này đã có trong lịch sử. Xoá thì lịch sử sẽ hiện mã bài thay cho tên. Vẫn xoá?')) return
                    updateProfile(profile.id, { customExercises: profile.customExercises.filter((x) => x.id !== e.id) })
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>Dữ liệu</SectionTitle>
      <Card className="divide-y divide-line/70 p-0">
        <ActionRow icon={<Download size={18} />} label="Xuất file sao lưu" onClick={exportData} />
        <ActionRow icon={<Upload size={18} />} label="Nhập từ file sao lưu" onClick={() => fileRef.current?.click()} />
      </Card>
      <p className="mt-2 px-2 text-xs leading-relaxed text-faint">
        Dữ liệu chỉ lưu trên máy này. Nên sao lưu mỗi tháng và cất file vào Tệp (iCloud Drive) để không mất khi xoá app hoặc đổi máy.
        {state.lastBackupAt ? ` Lần sao lưu gần nhất: ${formatShort(fromKey(state.lastBackupAt))}/${state.lastBackupAt.slice(0, 4)}.` : ' Chưa sao lưu lần nào.'}
      </p>
      {message && <p className="mt-2 px-2 text-sm text-accent-ink">{message}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) importData(f)
          e.target.value = ''
        }}
      />

      <SectionTitle>Người dùng</SectionTitle>
      <Card className="divide-y divide-line/70 p-0">
        <ActionRow icon={<Users size={18} />} label="Đổi người hoặc thêm người" onClick={() => setCurrentProfile(null)} />
        <ActionRow
          icon={<Trash2 size={18} />}
          label={`Xoá hồ sơ ${profile.name}`}
          danger
          onClick={() => {
            if (confirm(`Xoá hồ sơ ${profile.name} và toàn bộ buổi tập của người này? Không thể hoàn tác.`)) deleteProfile(profile.id)
          }}
        />
      </Card>

      <p className="mt-8 text-center text-xs text-faint">Thư viện bài tập: free-exercise-db (Unlicense)</p>
    </>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5">
      <span className="font-medium">{label}</span>
      {children}
    </div>
  )
}

function Stepper({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-full bg-card2 transition active:scale-90">
      {children}
    </button>
  )
}

function ActionRow({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`flex h-14 w-full items-center gap-3 px-4 text-left font-medium active:bg-card2 ${danger ? 'text-bad' : ''}`}>
      <span className={danger ? '' : 'text-mute'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {!danger && <ChevronRight size={18} className="text-faint" />}
    </button>
  )
}

function EditableList({ items, placeholder, onChange }: { items: string[]; placeholder: string; onChange: (items: string[]) => void }) {
  const [text, setText] = useState('')
  const add = () => {
    const v = text.trim()
    if (!v || items.includes(v)) return
    onChange([...items, v])
    setText('')
  }
  return (
    <Card>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((g) => (
            <span key={g} className="flex h-9 items-center gap-1.5 rounded-full bg-card2 pr-2 pl-3.5 text-sm font-medium">
              {g}
              <button type="button" aria-label={`Xoá ${g}`} onClick={() => onChange(items.filter((x) => x !== g))} className="flex h-6 w-6 items-center justify-center rounded-full text-faint active:bg-line">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="text-sm text-faint">Chưa có</div>
      )}
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 rounded-xl bg-card2 px-3.5 text-sm outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/50"
        />
        <button type="button" onClick={add} aria-label="Thêm" disabled={!text.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-bg disabled:opacity-30">
          <Plus size={20} />
        </button>
      </div>
    </Card>
  )
}

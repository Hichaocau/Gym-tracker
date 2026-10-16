import { CalendarDays, ChartColumn, House, Plus, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { applyAccent } from './lib/colors'
import { nowHHMM, todayKey } from './lib/date'
import { StoreProvider, useStore } from './lib/store'
import { CalendarScreen } from './screens/CalendarScreen'
import { ProfilePicker } from './screens/ProfilePicker'
import { SessionEditor } from './screens/SessionEditor'
import { SettingsScreen } from './screens/SettingsScreen'
import { StatsScreen } from './screens/StatsScreen'
import { Today } from './screens/Today'

type Tab = 'today' | 'calendar' | 'stats' | 'settings'

const TABS: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'today', label: 'Hôm nay', icon: House },
  { id: 'calendar', label: 'Lịch', icon: CalendarDays },
  { id: 'stats', label: 'Thống kê', icon: ChartColumn },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
]

function Shell() {
  const { currentProfile, getSession, updateSession } = useStore()
  const [tab, setTab] = useState<Tab>('today')
  const [editingDate, setEditingDate] = useState<string | null>(null)

  useEffect(() => {
    if (currentProfile) applyAccent(currentProfile.color)
  }, [currentProfile])

  if (!currentProfile) return <ProfilePicker />

  if (editingDate) return <SessionEditor key={currentProfile.id + editingDate} profile={currentProfile} date={editingDate} onClose={() => setEditingDate(null)} />

  /** Center button: open today's workout, starting the timer if it has not started yet. */
  const startWorkout = () => {
    const date = todayKey()
    if (!getSession(currentProfile.id, date)?.start) updateSession(currentProfile.id, date, (s) => ({ ...s, start: nowHHMM(), end: undefined }))
    setEditingDate(date)
  }

  const navButton = ({ id, label, icon: Icon }: (typeof TABS)[number]) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        setTab(id)
        window.scrollTo(0, 0)
      }}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${tab === id ? 'text-ink' : 'text-faint'}`}
    >
      <Icon size={22} strokeWidth={tab === id ? 2.4 : 1.8} />
      {label}
    </button>
  )

  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-[max(env(safe-area-inset-top),16px)] pb-32">
        {tab === 'today' && <Today profile={currentProfile} onOpenSession={setEditingDate} onStartWorkout={startWorkout} />}
        {tab === 'calendar' && <CalendarScreen profile={currentProfile} onOpenSession={setEditingDate} />}
        {tab === 'stats' && <StatsScreen key={currentProfile.id} profile={currentProfile} />}
        {tab === 'settings' && <SettingsScreen profile={currentProfile} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line/60 bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center px-2">
          {TABS.slice(0, 2).map(navButton)}
          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={startWorkout}
              aria-label="Tập ngay"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-bg shadow-[0_8px_24px_-6px_var(--color-accent)] transition active:scale-90"
            >
              <Plus size={28} strokeWidth={2.6} />
            </button>
          </div>
          {TABS.slice(2).map(navButton)}
        </div>
      </nav>
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

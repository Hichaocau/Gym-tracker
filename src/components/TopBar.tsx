import type { ReactNode } from 'react'
import { useStore } from '../lib/store'
import { Avatar } from './ui'

/** Large screen title with the current profile's avatar; tapping the avatar opens the profile picker. */
export function TopBar({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  const { currentProfile, setCurrentProfile } = useStore()
  return (
    <div className="mb-5 flex items-end justify-between gap-3 pt-2">
      <div className="min-w-0">
        {subtitle && <div className="mb-0.5 text-sm font-medium text-mute">{subtitle}</div>}
        <h1 className="truncate text-[28px] leading-tight font-bold tracking-tight">{title}</h1>
      </div>
      {currentProfile && (
        <button type="button" onClick={() => setCurrentProfile(null)} aria-label="Đổi người" className="transition active:scale-90">
          <Avatar profile={currentProfile} size={40} />
        </button>
      )}
    </div>
  )
}

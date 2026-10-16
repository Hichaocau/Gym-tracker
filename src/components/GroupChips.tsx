import { useStore } from '../lib/store'
import type { Profile } from '../types'
import { Chip } from './ui'

/** Multi-select muscle groups of a profile for one day. Toggling creates the session if needed. */
export function GroupChips({ profile, date, scroll = false }: { profile: Profile; date: string; scroll?: boolean }) {
  const { getSession, updateSession } = useStore()
  const selected = getSession(profile.id, date)?.groups ?? []
  // keep groups that were removed from the profile list but are still on this session
  const all = [...profile.groups, ...selected.filter((g) => !profile.groups.includes(g))]

  const toggle = (g: string) =>
    updateSession(profile.id, date, (s) => ({
      ...s,
      groups: s.groups.includes(g) ? s.groups.filter((x) => x !== g) : [...s.groups, g],
    }))

  return (
    <div className={scroll ? 'no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4' : 'flex flex-wrap gap-2'}>
      {all.map((g) => (
        <Chip key={g} active={selected.includes(g)} onClick={() => toggle(g)}>
          {g}
        </Chip>
      ))}
    </div>
  )
}

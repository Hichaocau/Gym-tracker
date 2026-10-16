import type { AppState } from '../types'
import { daysBetween, fromKey, todayKey } from './date'

/** Days after which the app nudges for a new backup. */
export const BACKUP_EVERY_DAYS = 30

/**
 * Hands the data file to the user. On iPhone this opens the share sheet
 * (Save to Files, AirDrop, Zalo…); elsewhere it downloads the file.
 * Returns false when the user cancelled the share sheet.
 */
export async function exportBackup(state: AppState): Promise<boolean> {
  const name = `gym-tracker-${todayKey()}.json`
  const json = JSON.stringify(state, null, 2)
  const file = new File([json], name, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Sao lưu Gym Tracker' })
      return true
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return false
      // share failed for another reason: fall back to a download
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}

/** Days since the last backup, counted from the first workout when there has never been one. */
export function daysSinceBackup(state: AppState): number | null {
  const since = state.lastBackupAt ?? state.sessions.map((s) => s.date).sort()[0]
  if (!since) return null
  return daysBetween(fromKey(since), fromKey(todayKey()))
}

/** Ask the browser not to evict our localStorage under storage pressure. */
export function requestPersistentStorage() {
  navigator.storage?.persist?.().catch(() => {})
}

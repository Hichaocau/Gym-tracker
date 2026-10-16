import type { ColorKey } from '../types'

export interface Palette {
  /** solid accent: buttons, filled calendar days, chart bars */
  main: string
  /** translucent tint for selected chips and rows */
  soft: string
  /** light text on dark / on soft tint */
  ink: string
}

export const COLORS: Record<ColorKey, Palette> = {
  teal: { main: '#2dd4a0', soft: 'rgb(45 212 160 / 0.14)', ink: '#9ff3d6' },
  pink: { main: '#ff6b9a', soft: 'rgb(255 107 154 / 0.15)', ink: '#ffb8cf' },
  blue: { main: '#5aa9ff', soft: 'rgb(90 169 255 / 0.15)', ink: '#bcdcff' },
  amber: { main: '#ffb547', soft: 'rgb(255 181 71 / 0.15)', ink: '#ffdca6' },
  purple: { main: '#a78bfa', soft: 'rgb(167 139 250 / 0.16)', ink: '#d9ceff' },
  coral: { main: '#ff7a50', soft: 'rgb(255 122 80 / 0.15)', ink: '#ffc3ad' },
}

export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[]

/** Text color to put on top of a solid accent. */
export const ON_ACCENT = '#0b0c0e'

export function applyAccent(color: ColorKey) {
  const c = COLORS[color]
  const root = document.documentElement.style
  root.setProperty('--accent', c.main)
  root.setProperty('--accent-soft', c.soft)
  root.setProperty('--accent-ink', c.ink)
}

import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { COLORS } from '../lib/colors'
import type { Profile } from '../types'

export function Avatar({ profile, size = 40, ring = false }: { profile: Profile; size?: number; ring?: boolean }) {
  const c = COLORS[profile.color]
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: c.soft,
        color: c.ink,
        boxShadow: ring ? `0 0 0 2px #0b0c0e, 0 0 0 4px ${c.main}` : `inset 0 0 0 1px ${c.main}40`,
      }}
    >
      {profile.name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  )
}

export function Chip({ active, children, className = '', ...rest }: { active?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition active:scale-95 ${
        active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-card text-mute'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = `rounded-3xl bg-card p-4 ${className}`
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} block w-full text-left transition active:scale-[0.99]`}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  )
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-3xl bg-card p-4">
      <div className="text-xs font-medium text-mute">{label}</div>
      <div className="tabular mt-1 text-2xl font-bold tracking-tight">{value}</div>
      {hint != null && <div className={`mt-0.5 text-xs ${tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-faint'}`}>{hint}</div>}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-7 mb-3 flex items-center justify-between px-1">
      <h2 className="text-[13px] font-semibold tracking-wide text-mute uppercase">{children}</h2>
      {action}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-bg font-semibold',
  secondary: 'bg-card2 text-ink font-medium',
  ghost: 'text-accent font-medium',
  danger: 'bg-bad/10 text-bad font-medium',
}

export function Button({ variant = 'primary', className = '', ...rest }: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`flex h-12 items-center justify-center gap-2 rounded-2xl px-5 transition active:scale-[0.98] disabled:opacity-35 ${VARIANT[variant]} ${className}`}
      {...rest}
    />
  )
}

export function IconButton({ label, className = '', ...rest }: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-card text-ink transition active:scale-90 ${className}`}
      {...rest}
    />
  )
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="flex rounded-2xl bg-card p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 truncate rounded-xl px-2 font-medium transition ${size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm'} ${
            o.value === value ? 'bg-card2 text-ink shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]' : 'text-faint'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Full-screen layer above the tab layout (workout, picker). */
export function Screen({ children, header, footer }: { children: ReactNode; header?: ReactNode; footer?: ReactNode }) {
  return (
    <div className="anim-fade fixed inset-0 z-30 flex flex-col bg-bg">
      {header && <div className="border-b border-line/60 bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">{header}</div>}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md px-4 pt-4 pb-32">{children}</div>
      </div>
      {footer && (
        <div className="border-t border-line/60 bg-bg/90 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur-xl">
          <div className="mx-auto max-w-md">{footer}</div>
        </div>
      )}
    </div>
  )
}

/** Bottom sheet modal. */
export function Sheet({ title, onClose, children }: { title?: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="anim-sheet max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-card pb-[max(env(safe-area-inset-bottom),16px)]" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-card px-5 pt-3 pb-2">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
          <div className="flex items-start justify-between gap-3">
            <div className="text-lg font-semibold">{title}</div>
            <IconButton label="Đóng" onClick={onClose} className="h-8 w-8 shrink-0 bg-card2">
              <X size={16} />
            </IconButton>
          </div>
        </div>
        <div className="px-5">{children}</div>
      </div>
    </div>
  )
}

export function ProgressRing({ value, max, size = 84, stroke = 9, children }: { value: number; max: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const len = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, value / max) : 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#26272c" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-line px-4 py-6 text-center text-sm text-faint">{children}</div>
}

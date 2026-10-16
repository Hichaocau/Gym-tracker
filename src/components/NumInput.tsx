import { useState } from 'react'

const parse = (t: string) => {
  const n = parseFloat(t.replace(',', '.'))
  return Number.isNaN(n) ? undefined : n
}
const show = (v?: number) => (v == null ? '' : String(v).replace('.', ','))

/** Numeric text input that accepts "12,5" or "12.5" and keeps partial typing like "12,". */
export function NumInput({
  value,
  onChange,
  placeholder,
  className = '',
  ariaLabel,
}: {
  value?: number
  onChange: (v: number | undefined) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}) {
  const [text, setText] = useState(show(value))
  const [lastValue, setLastValue] = useState(value)

  // sync when the value changes from outside (e.g. ticking a set fills it from last time)
  if (value !== lastValue) {
    setLastValue(value)
    if (parse(text) !== value) setText(show(value))
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={text}
      placeholder={placeholder}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value)
        onChange(parse(e.target.value))
      }}
      className={`tabular h-10 w-full rounded-xl bg-card2 px-2 text-center font-semibold outline-none placeholder:font-normal placeholder:text-faint focus:ring-2 focus:ring-accent/60 ${className}`}
    />
  )
}

const pad = (n: number) => String(n).padStart(2, '0')

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayKey = () => toKey(new Date())

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)

/** Monday of the week containing d. */
export const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7))

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000)

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

export const weekdayShort = (d: Date) => WEEKDAY[d.getDay()]

export const formatLong = (d: Date) => `${WEEKDAY_LONG[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`

export const formatShort = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`

export const nowHHMM = () => {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const hhmmToMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export const formatDuration = (min: number) => {
  if (min <= 0) return '0 phút'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (!h) return `${m} phút`
  return m ? `${h} giờ ${m} phút` : `${h} giờ`
}

export const formatDurationShort = (min: number) => {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? `${h}h${m ? pad(m) : ''}` : `${m}p`
}

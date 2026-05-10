/**
 * Relative label (e.g. "in 5 minutes", "3 days ago") plus absolute time for tooltips.
 */
export function formatRelativeClock(
  iso: string,
  locale: string | undefined,
): { label: string; title: string } | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null

  const loc = locale || 'en'
  const title = new Intl.DateTimeFormat(loc, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)

  const now = Date.now()
  const diffMs = d.getTime() - now
  const absMs = Math.abs(diffMs)
  const rtf = new Intl.RelativeTimeFormat(loc, { numeric: 'auto' })

  const s = 1000
  const m = 60 * s
  const h = 60 * m
  const dUnit = 24 * h

  let value: number
  let unit: Intl.RelativeTimeFormatUnit

  if (absMs < 45 * s) {
    value = Math.round(diffMs / s)
    unit = 'second'
  } else if (absMs < h) {
    value = Math.round(diffMs / m)
    unit = 'minute'
  } else if (absMs < dUnit) {
    value = Math.round(diffMs / h)
    unit = 'hour'
  } else if (absMs < 7 * dUnit) {
    value = Math.round(diffMs / dUnit)
    unit = 'day'
  } else if (absMs < 60 * dUnit) {
    value = Math.round(diffMs / (7 * dUnit))
    unit = 'week'
  } else if (absMs < 365 * dUnit) {
    value = Math.round(diffMs / (30 * dUnit))
    unit = 'month'
  } else {
    value = Math.round(diffMs / (365 * dUnit))
    unit = 'year'
  }

  return { label: rtf.format(value, unit), title }
}

/** Chapter row stored on `Episode.chapters` (TKC ingest). */
export type InflowEpisodeChapter = {
  start_seconds: number
  title: string
  url?: string
  image_url?: string
}

export function parseEpisodeChapters(raw: unknown): InflowEpisodeChapter[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: InflowEpisodeChapter[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const title = typeof r.title === 'string' ? r.title.trim() : ''
    const start =
      typeof r.start_seconds === 'number' && Number.isFinite(r.start_seconds)
        ? Math.trunc(r.start_seconds)
        : null
    if (!title || start == null || start < 0) continue
    out.push({
      start_seconds: start,
      title,
      ...(typeof r.url === 'string' && r.url.trim() ? { url: r.url.trim() } : {}),
      ...(typeof r.image_url === 'string' && r.image_url.trim()
        ? { image_url: r.image_url.trim() }
        : {}),
    })
  }
  return out.length > 0 ? out : undefined
}

export function formatEpisodeDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null
  const total = Math.trunc(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

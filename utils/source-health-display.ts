/**
 * Canonical health values from TopicKnowledgeCrawler `docs/SOURCE_STATUS_API.md`
 * (required field `sourceHealthStatus`).
 */
export const TKC_SOURCE_HEALTH_STATUSES = [
  'pending',
  'needs_setup',
  'healthy',
  'quiet',
  'degraded',
  'failing',
  'blocked',
  'paused',
] as const

export type TkcSourceHealthStatus = (typeof TKC_SOURCE_HEALTH_STATUSES)[number]

export function normalizeSourceHealthKey(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const t = raw.trim().toLowerCase()
  return t === '' ? null : t
}

export function isKnownTkcSourceHealthStatus(key: string): key is TkcSourceHealthStatus {
  return (TKC_SOURCE_HEALTH_STATUSES as readonly string[]).includes(key)
}

export type SourceHealthBadgeTone = 'success' | 'info' | 'warning' | 'error' | 'ghost'

/**
 * Map normalized health key to a small set of badge tones (DaisyUI-oriented).
 */
export function sourceHealthBadgeTone(normalizedKey: string | null): SourceHealthBadgeTone {
  if (!normalizedKey) return 'ghost'
  const k = normalizedKey
  if (k === 'healthy') return 'success'
  if (k === 'quiet' || k === 'paused') return 'info'
  if (k === 'pending' || k === 'needs_setup') return 'ghost'
  if (k === 'degraded') return 'warning'
  if (k === 'failing' || k === 'blocked') return 'error'
  // Legacy / unknown crawler strings (still show valueRaw label in UI)
  if (k.includes('degrad') || k === 'stale' || k === 'warning') return 'warning'
  if (k.includes('fail') || k === 'unhealthy' || k === 'dead') return 'error'
  return 'ghost'
}

/** [daisyUI Status](https://daisyui.com/components/status/) — dot + label beside it */
const TONE_TO_STATUS_CLASS: Record<SourceHealthBadgeTone, string> = {
  success: 'status status-success status-md',
  info: 'status status-info status-md',
  warning: 'status status-warning status-md',
  error: 'status status-error status-md',
  ghost: 'status status-neutral status-md',
}

export function sourceHealthStatusDotClass(normalizedKey: string | null): string {
  return TONE_TO_STATUS_CLASS[sourceHealthBadgeTone(normalizedKey)]
}

/**
 * Stable attribute for behavior tests: mirrors TKC `sourceHealthStatus` when present.
 * - `no_snapshot`: infl0 has no `SourceStatus` row yet.
 * - `missing`: row exists but `sourceHealthStatus` is empty.
 */
export function sourceHealthDataAttribute(
  latest: { sourceHealthStatus: string | null } | null,
): 'no_snapshot' | 'missing' | string {
  if (!latest) return 'no_snapshot'
  const k = normalizeSourceHealthKey(latest.sourceHealthStatus)
  if (!k) return 'missing'
  return k
}

/**
 * Stable triage rank for sorting `/feeds` worst-first.
 * Lower numbers come first; unknown / `no_snapshot` rows are pushed to the end
 * so users still notice them after the actionable ones.
 */
export const TRIAGE_RANK: Record<string, number> = {
  failing: 0,
  blocked: 1,
  degraded: 2,
  needs_setup: 3,
  pending: 4,
  quiet: 5,
  paused: 6,
  healthy: 7,
}

const TRIAGE_FALLBACK = 99

export function triageRank(latest: { sourceHealthStatus: string | null } | null): number {
  const k = normalizeSourceHealthKey(latest?.sourceHealthStatus ?? null)
  if (!k) return TRIAGE_FALLBACK
  return TRIAGE_RANK[k] ?? TRIAGE_FALLBACK
}

/** TKC statuses where the user (or operator) should look at this source. */
const ATTENTION_KEYS = new Set<string>(['failing', 'blocked', 'degraded', 'needs_setup'])

export function isAttentionStatus(latest: { sourceHealthStatus: string | null } | null): boolean {
  const k = normalizeSourceHealthKey(latest?.sourceHealthStatus ?? null)
  return k != null && ATTENTION_KEYS.has(k)
}

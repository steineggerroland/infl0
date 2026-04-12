/**
 * Normalize values to [0, 1]; missing inputs become 0.
 * Half-lives and caps are fixed constants so scores stay comparable.
 */

import type { TimelineScoreFactorId } from './timeline-score-factors'

const HOURS_PUBLISHED_HALF_LIFE = 72
const HOURS_INSERTED_HALF_LIFE = 48

const TITLE_LEN_CAP = 120
const TEASER_LEN_CAP = 400
const SUMMARY_LEN_CAP = 4000

function hoursSince(iso: string | null | undefined, nowMs: number): number | null {
  if (iso == null || iso === '') return null
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  return Math.max(0, (nowMs - t) / 3_600_000)
}

/** Exponential decay: recent → 1, old → 0 */
export function normalizeRecencyHours(hours: number | null, halfLifeHours: number): number {
  if (hours == null || halfLifeHours <= 0) return 0
  return Math.exp(-hours / halfLifeHours)
}

export function normalizeLength(len: number | null | undefined, cap: number): number {
  if (len == null || len <= 0 || cap <= 0) return 0
  return Math.min(1, len / cap)
}

/**
 * Combined title / teaser / summary length signal.
 * preference -100…100: negative → min(1, cap/len) (shorter scores higher);
 * positive → min(1, len/cap) (longer scores higher); 0 → feature 0 (no effect).
 * Magnitude scales how strongly the curve applies (|p|/100).
 */
export function normalizeContentLength(
  titleLen: number,
  teaserLen: number,
  summaryLen: number,
  preference: number,
): number {
  if (preference === 0) return 0
  const p = Math.min(100, Math.max(-100, Math.round(preference)))
  if (p === 0) return 0
  const strength = Math.abs(p) / 100

  function piece(len: number, cap: number): number {
    const c = cap > 0 ? cap : 1
    const L = Math.max(0, len)
    if (p > 0) {
      return Math.min(1, L / c)
    }
    const denom = Math.max(L, 1)
    return Math.min(1, c / denom)
  }

  const t = piece(titleLen, TITLE_LEN_CAP)
  const te = piece(teaserLen, TEASER_LEN_CAP)
  const s = piece(summaryLen, SUMMARY_LEN_CAP)
  return ((t + te + s) / 3) * strength
}

/** Fields needed to compute normalized timeline features */
export type ArticleScoreInput = {
  title: string
  publishedAt?: string
  /** `UserTimelineItem.insertedAt` when exposed by the API */
  insertedAt?: string | null
  teaser?: string
  summary_long?: string
  /** Placeholder until iterative mix / feedback signals exist */
  crawl_diversity?: number
  category_diversity?: number
  tag_diversity?: number
  engagement_positive?: number
  engagement_negative?: number
}

export type NormalizedTimelineFeatures = Record<TimelineScoreFactorId, number>

export function computeNormalizedFeatures(
  a: ArticleScoreInput,
  nowMs: number = Date.now(),
  contentLengthPreference: number = 0,
): NormalizedTimelineFeatures {
  const pubH = hoursSince(a.publishedAt, nowMs)
  const insH = hoursSince(a.insertedAt ?? null, nowMs)

  const teaser = a.teaser ?? ''
  const summary = a.summary_long ?? ''

  const content_length = normalizeContentLength(
    a.title?.length ?? 0,
    teaser.length,
    summary.length,
    contentLengthPreference,
  )

  return {
    published_recency: normalizeRecencyHours(pubH, HOURS_PUBLISHED_HALF_LIFE),
    inserted_recency: normalizeRecencyHours(insH, HOURS_INSERTED_HALF_LIFE),
    content_length,
    crawl_diversity: clamp01(a.crawl_diversity),
    category_diversity: clamp01(a.category_diversity),
    tag_diversity: clamp01(a.tag_diversity),
    engagement_positive: clamp01(a.engagement_positive),
    engagement_negative: clamp01(a.engagement_negative),
  }
}

function clamp01(x: number | null | undefined): number {
  if (x == null || Number.isNaN(x)) return 0
  return Math.min(1, Math.max(0, x))
}

/** score = Σ feature_i * (weight_i / 100) — weights 0…100 */
export function computeWeightedScore(
  features: NormalizedTimelineFeatures,
  weights: Record<TimelineScoreFactorId, number>,
): number {
  let s = 0
  for (const id of Object.keys(features) as TimelineScoreFactorId[]) {
    const w = weights[id]
    if (w == null || w <= 0) continue
    s += features[id] * (w / 100)
  }
  return s
}

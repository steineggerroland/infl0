/**
 * Timeline score: weighted sum of normalized features (each in [0, 1]).
 * `engagement_negative` is applied as a subtraction (penalty).
 * Missing inputs yield feature value 0 (see normalization helpers).
 */

export const TIMELINE_SCORE_VERSION = 3 as const

export type TimelineScoreFactorId =
  | 'published_recency'
  | 'inserted_recency'
  | 'content_length'
  | 'crawl_diversity'
  | 'category_diversity'
  | 'tag_diversity'
  | 'engagement_positive'
  | 'engagement_negative'

export type TimelineScoreFactorGroup = 'time' | 'content' | 'mix' | 'feedback'

export type TimelineScoreFactorDef = {
  id: TimelineScoreFactorId
  group: TimelineScoreFactorGroup
  /** Default weight 0–100 for sliders */
  defaultWeight: number
}

/** Panel order in **Settings → Adjust sorting** (must match `pages/settings/index.vue`). */
export const TIMELINE_SCORE_GROUP_ORDER: readonly TimelineScoreFactorGroup[] = [
  'time',
  'content',
  'mix',
  'feedback',
]

/** Display order in the settings UI */
export const TIMELINE_SCORE_FACTOR_DEFS: TimelineScoreFactorDef[] = [
  { id: 'published_recency', group: 'time', defaultWeight: 100 },
  { id: 'inserted_recency', group: 'time', defaultWeight: 80 },
  { id: 'content_length', group: 'content', defaultWeight: 30 },
  { id: 'crawl_diversity', group: 'mix', defaultWeight: 0 },
  { id: 'category_diversity', group: 'mix', defaultWeight: 0 },
  { id: 'tag_diversity', group: 'mix', defaultWeight: 0 },
  { id: 'engagement_positive', group: 'feedback', defaultWeight: 0 },
  { id: 'engagement_negative', group: 'feedback', defaultWeight: 0 },
]

export function defaultTimelineScoreWeights(): Record<TimelineScoreFactorId, number> {
  const o = {} as Record<TimelineScoreFactorId, number>
  for (const d of TIMELINE_SCORE_FACTOR_DEFS) {
    o[d.id] = d.defaultWeight
  }
  return o
}

export function clampWeight(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** Slider for title/teaser/summary curve: -100 = strong shorter, 0 = neutral, +100 = strong longer */
export function clampContentLengthPreference(n: number): number {
  return Math.min(100, Math.max(-100, Math.round(n)))
}

export function defaultContentLengthPreference(): number {
  return 0
}

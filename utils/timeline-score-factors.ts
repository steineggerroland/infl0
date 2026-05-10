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

/**
 * Explicit per-source preference (`UserFeed.userPreferenceWeight`).
 *
 * Value range: −1.0 … +1.0 in 0.25 steps. Independent of the engagement
 * sliders so that the user's "more / less of this source" command always
 * has a noticeable effect even when implicit-engagement weights are 0.
 */
export const SOURCE_PREFERENCE_STEP = 0.25 as const
export const SOURCE_PREFERENCE_MIN = -1 as const
export const SOURCE_PREFERENCE_MAX = 1 as const

/**
 * Score bonus per full preference unit. A `+1` rating adds this much to the
 * raw `rank_score`; intermediate steps scale linearly. Tuned to be visible
 * but not overwhelm freshness / content signals.
 */
export const SOURCE_PREFERENCE_BONUS = 0.5 as const

/**
 * The 9 valid preference values. Useful for UI controls + validation.
 */
export const SOURCE_PREFERENCE_STEPS = [
  -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1,
] as const

export type SourcePreferenceStep = (typeof SOURCE_PREFERENCE_STEPS)[number]

const QUANTUM = 4 // 1 / 0.25

/**
 * Returns the input snapped to the nearest 0.25 step, clamped to [-1, +1].
 * Returns `null` if the value is not a finite number.
 */
export function quantizeSourcePreference(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const snapped = Math.round(value * QUANTUM) / QUANTUM
  if (snapped < SOURCE_PREFERENCE_MIN) return SOURCE_PREFERENCE_MIN
  if (snapped > SOURCE_PREFERENCE_MAX) return SOURCE_PREFERENCE_MAX
  // Avoid -0 leaking through.
  return snapped === 0 ? 0 : snapped
}

/**
 * Strict variant: rejects values that aren't already on the quantized grid.
 * Useful at API boundary where we don't want to silently snap user input.
 */
export function validateSourcePreference(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < SOURCE_PREFERENCE_MIN || value > SOURCE_PREFERENCE_MAX) return null
  const snapped = Math.round(value * QUANTUM) / QUANTUM
  if (Math.abs(snapped - value) > 1e-9) return null
  return snapped
}

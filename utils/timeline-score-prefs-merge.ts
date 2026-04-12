import {
  TIMELINE_SCORE_FACTOR_DEFS,
  clampContentLengthPreference,
  clampWeight,
  defaultContentLengthPreference,
  defaultTimelineScoreWeights,
  type TimelineScoreFactorId,
} from './timeline-score-factors'

const FACTOR_IDS = new Set<TimelineScoreFactorId>(
  TIMELINE_SCORE_FACTOR_DEFS.map((d) => d.id),
)

export type TimelineScorePrefsStored = {
  v: number
  weights: Partial<Record<TimelineScoreFactorId, number>>
  contentLengthPreference?: number
}

export function isTimelineScoreFactorId(id: string): id is TimelineScoreFactorId {
  return FACTOR_IDS.has(id as TimelineScoreFactorId)
}

/** Merge partial weights onto defaults (clamped 0–100). */
export function mergePartialWeights(
  partial: Partial<Record<TimelineScoreFactorId, number>> | undefined | null,
): Record<TimelineScoreFactorId, number> {
  const base = defaultTimelineScoreWeights()
  if (partial == null) return base
  for (const id of Object.keys(base) as TimelineScoreFactorId[]) {
    const n = partial[id]
    if (typeof n === 'number') base[id] = clampWeight(n)
  }
  return base
}

/**
 * Parse stored JSON from DB or localStorage. Returns null if invalid.
 */
export function parseTimelineScorePrefsFromJson(json: unknown): {
  weights: Record<TimelineScoreFactorId, number>
  contentLengthPreference: number
} | null {
  if (json == null || typeof json !== 'object' || Array.isArray(json)) return null
  const j = json as Record<string, unknown>
  if (j.weights == null || typeof j.weights !== 'object' || Array.isArray(j.weights)) return null
  const v = j.v
  if (typeof v !== 'number' || v < 1) return null
  const weights = mergePartialWeights(j.weights as Partial<Record<TimelineScoreFactorId, number>>)
  const contentLengthPreference =
    v === 1
      ? defaultContentLengthPreference()
      : clampContentLengthPreference(Number(j.contentLengthPreference ?? 0))
  return { weights, contentLengthPreference }
}

/** Resolved prefs for scoring: DB JSON or defaults. */
export function resolveTimelineScorePrefs(json: unknown | null | undefined): {
  weights: Record<TimelineScoreFactorId, number>
  contentLengthPreference: number
} {
  return (
    parseTimelineScorePrefsFromJson(json) ?? {
      weights: defaultTimelineScoreWeights(),
      contentLengthPreference: defaultContentLengthPreference(),
    }
  )
}

import { TIMELINE_SCORE_FACTOR_DEFS, type TimelineScoreFactorId } from './timeline-score-factors'
import type { NormalizedTimelineFeatures } from './timeline-score-normalize'

export type FactorContributionRow = {
  id: TimelineScoreFactorId
  normalized: number
  weight: number
  contribution: number
}

export function factorContributionsFromFeatures(
  features: NormalizedTimelineFeatures,
  weights: Record<TimelineScoreFactorId, number>,
): FactorContributionRow[] {
  return TIMELINE_SCORE_FACTOR_DEFS.map((def) => {
    const id = def.id
    const normalized = features[id]
    const weight = weights[id] ?? 0
    const magnitude = normalized * (weight / 100)
    const contribution = id === 'engagement_negative' ? -magnitude : magnitude
    return { id, normalized, weight, contribution }
  })
}

export function sumFactorContributions(rows: FactorContributionRow[]): number {
  return rows.reduce((s, r) => s + r.contribution, 0)
}

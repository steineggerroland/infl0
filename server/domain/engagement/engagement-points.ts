import type { ArticleEngagementSegment } from '../../../utils/article-engagement'

export type EngagementPointDelta = {
  positive: number
  negative: number
}

/**
 * Domain rules for transforming article-view events into preference points.
 */
export function pointsForEngagementEvent(
  segment: ArticleEngagementSegment,
  durationSec: number,
): EngagementPointDelta {
  let positive = 0
  let negative = 0

  if (segment === 'summary') positive += 1
  if (segment === 'body') positive += 2

  if ((segment === 'summary' || segment === 'body') && durationSec >= 10) {
    positive += 3
  }
  if ((segment === 'summary' || segment === 'body') && durationSec < 2) {
    negative += 2
  }
  if (segment === 'body' && durationSec >= 30) {
    positive += 2
  }

  return { positive, negative }
}


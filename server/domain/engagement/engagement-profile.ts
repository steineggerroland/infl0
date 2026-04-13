type Counter = { posPoints: number; negPoints: number }

const PRIOR_ALPHA = 1
const PRIOR_BETA = 1

const FEED_WEIGHT = 0.25
const CATEGORY_WEIGHT = 0.25
const TAG_WEIGHT = 0.5

export function scoreFromCounters(counter: Counter | null | undefined): number {
  const pos = Math.max(0, counter?.posPoints ?? 0)
  const neg = Math.max(0, counter?.negPoints ?? 0)
  return (PRIOR_ALPHA + pos) / (PRIOR_ALPHA + PRIOR_BETA + pos + neg)
}

export function negativeScoreFromCounters(counter: Counter | null | undefined): number {
  const pos = Math.max(0, counter?.posPoints ?? 0)
  const neg = Math.max(0, counter?.negPoints ?? 0)
  return (PRIOR_BETA + neg) / (PRIOR_ALPHA + PRIOR_BETA + pos + neg)
}

function averageOrNeutral(values: number[]): number {
  if (values.length === 0) return 0.5
  return values.reduce((sum, x) => sum + x, 0) / values.length
}

export function articleEngagementPositive(params: {
  crawlKey: string
  categories: string[]
  tags: string[]
  feedMap: Map<string, Counter>
  categoryMap: Map<string, Counter>
  tagMap: Map<string, Counter>
}): number {
  const feedScore = scoreFromCounters(params.feedMap.get(params.crawlKey))
  const categoryScores = params.categories.map((c) => scoreFromCounters(params.categoryMap.get(c)))
  const tagScores = params.tags.map((t) => scoreFromCounters(params.tagMap.get(t)))
  return (
    FEED_WEIGHT * feedScore +
    CATEGORY_WEIGHT * averageOrNeutral(categoryScores) +
    TAG_WEIGHT * averageOrNeutral(tagScores)
  )
}

export function articleEngagementNegative(params: {
  crawlKey: string
  categories: string[]
  tags: string[]
  feedMap: Map<string, Counter>
  categoryMap: Map<string, Counter>
  tagMap: Map<string, Counter>
}): number {
  const feedScore = negativeScoreFromCounters(params.feedMap.get(params.crawlKey))
  const categoryScores = params.categories.map((c) =>
    negativeScoreFromCounters(params.categoryMap.get(c)),
  )
  const tagScores = params.tags.map((t) => negativeScoreFromCounters(params.tagMap.get(t)))
  return (
    FEED_WEIGHT * feedScore +
    CATEGORY_WEIGHT * averageOrNeutral(categoryScores) +
    TAG_WEIGHT * averageOrNeutral(tagScores)
  )
}


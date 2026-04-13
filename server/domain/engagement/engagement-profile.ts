export type EngagementCounter = { posPoints: number; negPoints: number }

const PRIOR_ALPHA = 1
const PRIOR_BETA = 1

const FEED_WEIGHT = 0.25
const CATEGORY_WEIGHT = 0.25
const TAG_WEIGHT = 0.5

/** Exported for dashboards / explainability */
export const ENGAGEMENT_PRIOR = { alpha: PRIOR_ALPHA, beta: PRIOR_BETA } as const
export const ENGAGEMENT_BLEND_WEIGHTS = {
  feed: FEED_WEIGHT,
  category: CATEGORY_WEIGHT,
  tag: TAG_WEIGHT,
} as const

export function scoreFromCounters(counter: EngagementCounter | null | undefined): number {
  const pos = Math.max(0, counter?.posPoints ?? 0)
  const neg = Math.max(0, counter?.negPoints ?? 0)
  return (PRIOR_ALPHA + pos) / (PRIOR_ALPHA + PRIOR_BETA + pos + neg)
}

export function negativeScoreFromCounters(counter: EngagementCounter | null | undefined): number {
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
  feedMap: Map<string, EngagementCounter>
  categoryMap: Map<string, EngagementCounter>
  tagMap: Map<string, EngagementCounter>
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
  feedMap: Map<string, EngagementCounter>
  categoryMap: Map<string, EngagementCounter>
  tagMap: Map<string, EngagementCounter>
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

export type ArticleEngagementExplanation = {
  feed: {
    crawlKey: string
    posPoints: number
    negPoints: number
    positiveScore: number
    negativeScore: number
    weightedPositive: number
    weightedNegative: number
  }
  categories: Array<{
    name: string
    posPoints: number
    negPoints: number
    positiveScore: number
    negativeScore: number
  }>
  tags: Array<{
    name: string
    posPoints: number
    negPoints: number
    positiveScore: number
    negativeScore: number
  }>
  averages: {
    categoryPositive: number
    categoryNegative: number
    categoryWeightedPositive: number
    categoryWeightedNegative: number
    tagPositive: number
    tagNegative: number
    tagWeightedPositive: number
    tagWeightedNegative: number
  }
  blend: typeof ENGAGEMENT_BLEND_WEIGHTS
  combinedPositive: number
  combinedNegative: number
}

/**
 * Structured breakdown for personalization explainability (matches ranking inputs).
 */
export function explainArticleEngagement(params: {
  crawlKey: string
  categories: string[]
  tags: string[]
  feedMap: Map<string, EngagementCounter>
  categoryMap: Map<string, EngagementCounter>
  tagMap: Map<string, EngagementCounter>
}): ArticleEngagementExplanation {
  const feedCounter = params.feedMap.get(params.crawlKey)
  const feedPos = scoreFromCounters(feedCounter)
  const feedNeg = negativeScoreFromCounters(feedCounter)

  const categories = params.categories.map((name) => {
    const c = params.categoryMap.get(name)
    return {
      name,
      posPoints: c?.posPoints ?? 0,
      negPoints: c?.negPoints ?? 0,
      positiveScore: scoreFromCounters(c),
      negativeScore: negativeScoreFromCounters(c),
    }
  })

  const tags = params.tags.map((name) => {
    const t = params.tagMap.get(name)
    return {
      name,
      posPoints: t?.posPoints ?? 0,
      negPoints: t?.negPoints ?? 0,
      positiveScore: scoreFromCounters(t),
      negativeScore: negativeScoreFromCounters(t),
    }
  })

  const categoryAvgPositive = averageOrNeutral(categories.map((c) => c.positiveScore))
  const categoryAvgNegative = averageOrNeutral(categories.map((c) => c.negativeScore))
  const tagAvgPositive = averageOrNeutral(tags.map((t) => t.positiveScore))
  const tagAvgNegative = averageOrNeutral(tags.map((t) => t.negativeScore))

  return {
    feed: {
      crawlKey: params.crawlKey,
      posPoints: feedCounter?.posPoints ?? 0,
      negPoints: feedCounter?.negPoints ?? 0,
      positiveScore: feedPos,
      negativeScore: feedNeg,
      weightedPositive: FEED_WEIGHT * feedPos,
      weightedNegative: FEED_WEIGHT * feedNeg,
    },
    categories,
    tags,
    averages: {
      categoryPositive: categoryAvgPositive,
      categoryNegative: categoryAvgNegative,
      categoryWeightedPositive: CATEGORY_WEIGHT * categoryAvgPositive,
      categoryWeightedNegative: CATEGORY_WEIGHT * categoryAvgNegative,
      tagPositive: tagAvgPositive,
      tagNegative: tagAvgNegative,
      tagWeightedPositive: TAG_WEIGHT * tagAvgPositive,
      tagWeightedNegative: TAG_WEIGHT * tagAvgNegative,
    },
    blend: ENGAGEMENT_BLEND_WEIGHTS,
    combinedPositive: articleEngagementPositive(params),
    combinedNegative: articleEngagementNegative(params),
  }
}


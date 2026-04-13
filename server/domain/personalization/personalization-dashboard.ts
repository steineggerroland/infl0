import type { Prisma, PrismaClient } from '@prisma/client'
import { TIMELINE_SCORE_VERSION } from '../../../utils/timeline-score-factors'
import { resolveTimelineScorePrefs } from '../../../utils/timeline-score-prefs-merge'
import {
  computeNormalizedFeatures,
  computeWeightedScore,
  type ArticleScoreInput,
} from '../../../utils/timeline-score-normalize'
import {
  factorContributionsFromFeatures,
  type FactorContributionRow,
} from '../../../utils/timeline-score-breakdown'
import {
  ENGAGEMENT_BLEND_WEIGHTS,
  ENGAGEMENT_PRIOR,
  articleEngagementNegative,
  articleEngagementPositive,
  explainArticleEngagement,
  scoreFromCounters,
  type EngagementCounter,
} from '../engagement/engagement-profile'

const TIMELINE_PREVIEW_LIMIT = 40
const PIE_MAX_SLICES = 14

function normalizeKeys(values: string[] | null | undefined): string[] {
  if (!values || values.length === 0) return []
  const out = new Set<string>()
  for (const raw of values) {
    const v = raw.trim().toLowerCase()
    if (v) out.add(v)
  }
  return [...out]
}

type TimelineRow = {
  id: string
  insertedAt: Date
  rankScore: number | null
  scoredAt: Date | null
  article: {
    id: string
    crawlKey: string
    title: string
    publishedAt: Date | null
    fetchedAt: Date
    enrichment: {
      teaser: string | null
      summaryLong: string | null
      category: string[]
      tags: string[]
    } | null
  }
}

function rowToArticleScoreInput(
  row: TimelineRow,
  engagement: { positive: number; negative: number },
): ArticleScoreInput {
  const a = row.article
  const e = a.enrichment
  return {
    title: a.title,
    publishedAt: (a.publishedAt ?? a.fetchedAt).toISOString(),
    insertedAt: row.insertedAt.toISOString(),
    teaser: e?.teaser ?? '',
    summary_long: e?.summaryLong ?? '',
    engagement_positive: engagement.positive,
    engagement_negative: engagement.negative,
  }
}

function truncateTeaser(text: string, max = 140): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function buildPieSlices(
  rows: Array<{ key: string; label: string; weight: number }>,
  maxSlices = PIE_MAX_SLICES,
): Array<{ key: string; label: string; weight: number; share: number }> {
  const positive = rows.filter((r) => r.weight > 0)
  const sorted = [...positive].sort((a, b) => b.weight - a.weight)
  if (sorted.length === 0) return []

  if (sorted.length <= maxSlices) {
    const sum = sorted.reduce((s, x) => s + x.weight, 0)
    return sorted.map((x) => ({
      ...x,
      share: sum > 0 ? x.weight / sum : 0,
    }))
  }

  const head = sorted.slice(0, maxSlices - 1)
  const tail = sorted.slice(maxSlices - 1)
  const otherWeight = tail.reduce((s, x) => s + x.weight, 0)
  const merged = [...head, { key: '__other__', label: '__other__', weight: otherWeight }]
  const sum = merged.reduce((s, x) => s + x.weight, 0)
  return merged
    .filter((x) => x.weight > 0)
    .map((x) => ({
      ...x,
      share: sum > 0 ? x.weight / sum : 0,
    }))
}

export type PersonalizationDashboardPayload = {
  generatedAt: string
  prefs: {
    version: number
    weights: Record<string, number>
    contentLengthPreference: number
  }
  engagementModel: {
    prior: { alpha: number; beta: number }
    blend: { feed: number; category: number; tag: number }
  }
  pies: {
    feeds: Array<{ key: string; label: string; weight: number; share: number }>
    categories: Array<{ key: string; label: string; weight: number; share: number }>
    tags: Array<{ key: string; label: string; weight: number; share: number }>
  }
  timeline: Array<{
    timelineItemId: string
    articleId: string
    title: string
    teaserPreview: string
    rankScore: number | null
    scoredAt: string | null
    factors: FactorContributionRow[]
    rankScoreFromFactors: number
    engagement: ReturnType<typeof explainArticleEngagement>
  }>
}

export async function buildPersonalizationDashboardPayload(
  db: PrismaClient,
  userId: string,
): Promise<PersonalizationDashboardPayload | null> {
  const nowMs = Date.now()
  const generatedAt = new Date(nowMs).toISOString()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timelineScorePrefs: true },
  })
  if (!user) {
    return null
  }

  const prefsResolved = resolveTimelineScorePrefs(user.timelineScorePrefs)
  const { weights, contentLengthPreference } = prefsResolved

  const [userFeeds, feedAggRows, categoryAggRows, tagAggRows, anyScored] = await Promise.all([
    db.userFeed.findMany({
      where: { userId, active: true },
      select: { crawlKey: true, displayTitle: true, feedUrl: true },
    }),
    db.userFeedEngagement.findMany({
      where: { userId },
      select: { crawlKey: true, posPoints: true, negPoints: true },
    }),
    db.userCategoryEngagement.findMany({
      where: { userId },
      select: { category: true, posPoints: true, negPoints: true },
    }),
    db.userTagEngagement.findMany({
      where: { userId },
      select: { tag: true, posPoints: true, negPoints: true },
    }),
    db.userTimelineItem.findFirst({
      where: { userId, rankScore: { not: null } },
      select: { id: true },
    }),
  ])

  const feedLabelByKey = new Map(
    userFeeds.map((f) => [f.crawlKey, (f.displayTitle?.trim() || f.feedUrl) as string]),
  )

  const feedMap = new Map(feedAggRows.map((r) => [r.crawlKey, r] as const))
  const categoryMap = new Map(categoryAggRows.map((r) => [r.category, r] as const))
  const tagMap = new Map(tagAggRows.map((r) => [r.tag, r] as const))

  const feedPieRaw = feedAggRows.map((r) => ({
    key: r.crawlKey,
    label: feedLabelByKey.get(r.crawlKey) ?? r.crawlKey,
    weight: scoreFromCounters(r),
  }))
  const categoryPieRaw = categoryAggRows.map((r) => ({
    key: r.category,
    label: r.category,
    weight: scoreFromCounters(r),
  }))
  const tagPieRaw = tagAggRows.map((r) => ({
    key: r.tag,
    label: r.tag,
    weight: scoreFromCounters(r),
  }))

  const orderBy: Prisma.UserTimelineItemOrderByWithRelationInput[] = anyScored
    ? [
        { rankScore: { sort: 'desc', nulls: 'last' } },
        { article: { publishedAt: 'desc' } },
        { article: { id: 'desc' } },
      ]
    : [{ article: { publishedAt: 'desc' } }, { article: { id: 'desc' } }]

  const rows = await db.userTimelineItem.findMany({
    where: { userId },
    orderBy,
    take: TIMELINE_PREVIEW_LIMIT,
    select: {
      id: true,
      insertedAt: true,
      rankScore: true,
      scoredAt: true,
      article: {
        select: {
          id: true,
          crawlKey: true,
          title: true,
          publishedAt: true,
          fetchedAt: true,
          enrichment: { select: { teaser: true, summaryLong: true, category: true, tags: true } },
        },
      },
    },
  })

  const timeline = rows.map((row) => {
    const r = row as unknown as TimelineRow
    const categories = normalizeKeys(r.article.enrichment?.category)
    const tags = normalizeKeys(r.article.enrichment?.tags)
    const pos = articleEngagementPositive({
      crawlKey: r.article.crawlKey,
      categories,
      tags,
      feedMap: feedMap as Map<string, EngagementCounter>,
      categoryMap: categoryMap as Map<string, EngagementCounter>,
      tagMap: tagMap as Map<string, EngagementCounter>,
    })
    const neg = articleEngagementNegative({
      crawlKey: r.article.crawlKey,
      categories,
      tags,
      feedMap: feedMap as Map<string, EngagementCounter>,
      categoryMap: categoryMap as Map<string, EngagementCounter>,
      tagMap: tagMap as Map<string, EngagementCounter>,
    })
    const input = rowToArticleScoreInput(r, { positive: pos, negative: neg })
    const features = computeNormalizedFeatures(input, nowMs, contentLengthPreference)
    const factors = factorContributionsFromFeatures(features, weights)
    const rankScoreFromFactors = computeWeightedScore(features, weights)
    const engagement = explainArticleEngagement({
      crawlKey: r.article.crawlKey,
      categories,
      tags,
      feedMap: feedMap as Map<string, EngagementCounter>,
      categoryMap: categoryMap as Map<string, EngagementCounter>,
      tagMap: tagMap as Map<string, EngagementCounter>,
    })
    const teaser = r.article.enrichment?.teaser ?? ''
    return {
      timelineItemId: r.id,
      articleId: r.article.id,
      title: r.article.title,
      teaserPreview: truncateTeaser(teaser),
      rankScore: r.rankScore,
      scoredAt: r.scoredAt?.toISOString() ?? null,
      factors,
      rankScoreFromFactors,
      engagement,
    }
  })

  return {
    generatedAt,
    prefs: {
      version: TIMELINE_SCORE_VERSION,
      weights: { ...weights },
      contentLengthPreference,
    },
    engagementModel: {
      prior: { ...ENGAGEMENT_PRIOR },
      blend: { ...ENGAGEMENT_BLEND_WEIGHTS },
    },
    pies: {
      feeds: buildPieSlices(feedPieRaw),
      categories: buildPieSlices(categoryPieRaw),
      tags: buildPieSlices(tagPieRaw),
    },
    timeline,
  }
}

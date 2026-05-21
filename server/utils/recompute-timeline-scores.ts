import type { PrismaClient } from '~/generated/prisma/client'
import {
  computeNormalizedFeatures,
  computeWeightedScore,
  type ArticleScoreInput,
} from '../../utils/timeline-score-normalize'
import { resolveTimelineScorePrefs } from '../../utils/timeline-score-prefs-merge'
import { SOURCE_PREFERENCE_BONUS } from '../../utils/timeline-score-factors'
import {
  articleEngagementNegative,
  articleEngagementPositive,
} from '../domain/engagement/engagement-profile'

type TimelineRow = {
  id: string
  insertedAt: Date
  article: {
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

function normalizeKeys(values: string[] | null | undefined): string[] {
  if (!values || values.length === 0) return []
  const out = new Set<string>()
  for (const raw of values) {
    const v = raw.trim().toLowerCase()
    if (v) out.add(v)
  }
  return [...out]
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

const UPDATE_CHUNK = 80

export type RecomputeTimelineScoresOptions = {
  /**
   * When set, only timeline items whose article `crawlKey` is in this list are
   * rescored. Use after a per-feed preference change — the bonus term only
   * applies per source, so other rows are unchanged.
   */
  crawlKeys?: string[]
}

export async function recomputeTimelineScoresForUser(
  db: PrismaClient,
  userId: string,
  options?: RecomputeTimelineScoresOptions,
): Promise<{ updated: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timelineScorePrefs: true },
  })
  if (!user) return { updated: 0 }

  const crawlKeysFilter =
    options?.crawlKeys?.map((k) => k.trim()).filter((k) => k.length > 0) ?? undefined
  if (crawlKeysFilter !== undefined && crawlKeysFilter.length === 0) {
    return { updated: 0 }
  }

  const { weights, contentLengthPreference } = resolveTimelineScorePrefs(user.timelineScorePrefs)
  const nowMs = Date.now()
  const scoredAt = new Date()

  const itemsWhere =
    crawlKeysFilter != null && crawlKeysFilter.length > 0
      ? { userId, contentKind: 'article' as const, article: { crawlKey: { in: crawlKeysFilter } } }
      : { userId, contentKind: 'article' as const }

  const items = await db.userTimelineItem.findMany({
    where: itemsWhere,
    select: {
      id: true,
      insertedAt: true,
      article: {
        select: {
          title: true,
          crawlKey: true,
          publishedAt: true,
          fetchedAt: true,
          enrichment: { select: { teaser: true, summaryLong: true, category: true, tags: true } },
        },
      },
    },
  })

  const [feedAggRows, categoryAggRows, tagAggRows, userFeedRows] = await Promise.all([
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
    db.userFeed.findMany({
      where: { userId },
      select: { crawlKey: true, userPreferenceWeight: true },
    }),
  ])

  const feedMap = new Map(feedAggRows.map((r) => [r.crawlKey, r] as const))
  const categoryMap = new Map(categoryAggRows.map((r) => [r.category, r] as const))
  const tagMap = new Map(tagAggRows.map((r) => [r.tag, r] as const))
  // Latest explicit preference per crawlKey wins (ignore subscriptions with weight 0).
  const preferenceByCrawlKey = new Map<string, number>()
  for (const r of userFeedRows) {
    if (typeof r.userPreferenceWeight === 'number' && r.userPreferenceWeight !== 0) {
      preferenceByCrawlKey.set(r.crawlKey, r.userPreferenceWeight)
    }
  }

  const updates: { id: string; rankScore: number }[] = []
  for (const row of items) {
    const article = row.article
    if (!article) continue
    const categories = normalizeKeys(article.enrichment?.category)
    const tags = normalizeKeys(article.enrichment?.tags)
    const positive = articleEngagementPositive({
      crawlKey: article.crawlKey,
      categories,
      tags,
      feedMap,
      categoryMap,
      tagMap,
    })
    const negative = articleEngagementNegative({
      crawlKey: article.crawlKey,
      categories,
      tags,
      feedMap,
      categoryMap,
      tagMap,
    })
    const input = rowToArticleScoreInput(row as TimelineRow, { positive, negative })
    const features = computeNormalizedFeatures(input, nowMs, contentLengthPreference)
    const baseScore = computeWeightedScore(features, weights)
    const pref = preferenceByCrawlKey.get(article.crawlKey) ?? 0
    const score = baseScore + pref * SOURCE_PREFERENCE_BONUS
    updates.push({ id: row.id, rankScore: score })
  }

  for (let i = 0; i < updates.length; i += UPDATE_CHUNK) {
    const chunk = updates.slice(i, i + UPDATE_CHUNK)
    await db.$transaction(
      chunk.map((u) =>
        db.userTimelineItem.update({
          where: { id: u.id },
          data: { rankScore: u.rankScore, scoredAt },
        }),
      ),
    )
  }

  return { updated: updates.length }
}

export async function recomputeTimelineScoresForAllUsers(
  db: PrismaClient,
): Promise<{ users: number; items: number }> {
  const users = await db.user.findMany({ select: { id: true } })
  let items = 0
  for (const u of users) {
    const r = await recomputeTimelineScoresForUser(db, u.id)
    items += r.updated
  }
  return { users: users.length, items }
}

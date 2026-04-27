import type { PrismaClient } from '~/generated/prisma/client'
import {
  computeNormalizedFeatures,
  computeWeightedScore,
  type ArticleScoreInput,
} from '../../utils/timeline-score-normalize'
import { resolveTimelineScorePrefs } from '../../utils/timeline-score-prefs-merge'
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

export async function recomputeTimelineScoresForUser(
  db: PrismaClient,
  userId: string,
): Promise<{ updated: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timelineScorePrefs: true },
  })
  if (!user) return { updated: 0 }

  const { weights, contentLengthPreference } = resolveTimelineScorePrefs(user.timelineScorePrefs)
  const nowMs = Date.now()
  const scoredAt = new Date()

  const items = await db.userTimelineItem.findMany({
    where: { userId },
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

  const [feedAggRows, categoryAggRows, tagAggRows] = await Promise.all([
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
  ])

  const feedMap = new Map(feedAggRows.map((r) => [r.crawlKey, r] as const))
  const categoryMap = new Map(categoryAggRows.map((r) => [r.category, r] as const))
  const tagMap = new Map(tagAggRows.map((r) => [r.tag, r] as const))

  const updates: { id: string; rankScore: number }[] = []
  for (const row of items) {
    const categories = normalizeKeys(row.article.enrichment?.category)
    const tags = normalizeKeys(row.article.enrichment?.tags)
    const positive = articleEngagementPositive({
      crawlKey: row.article.crawlKey,
      categories,
      tags,
      feedMap,
      categoryMap,
      tagMap,
    })
    const negative = articleEngagementNegative({
      crawlKey: row.article.crawlKey,
      categories,
      tags,
      feedMap,
      categoryMap,
      tagMap,
    })
    const input = rowToArticleScoreInput(row as TimelineRow, { positive, negative })
    const features = computeNormalizedFeatures(input, nowMs, contentLengthPreference)
    const score = computeWeightedScore(features, weights)
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

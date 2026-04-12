import type { PrismaClient } from '@prisma/client'
import {
  computeNormalizedFeatures,
  computeWeightedScore,
  type ArticleScoreInput,
} from '../../utils/timeline-score-normalize'
import { resolveTimelineScorePrefs } from '../../utils/timeline-score-prefs-merge'

type TimelineRow = {
  id: string
  insertedAt: Date
  article: {
    title: string
    publishedAt: Date | null
    fetchedAt: Date
    enrichment: { teaser: string | null; summaryLong: string | null } | null
  }
}

function rowToArticleScoreInput(row: TimelineRow): ArticleScoreInput {
  const a = row.article
  const e = a.enrichment
  return {
    title: a.title,
    publishedAt: (a.publishedAt ?? a.fetchedAt).toISOString(),
    insertedAt: row.insertedAt.toISOString(),
    teaser: e?.teaser ?? '',
    summary_long: e?.summaryLong ?? '',
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
          publishedAt: true,
          fetchedAt: true,
          enrichment: { select: { teaser: true, summaryLong: true } },
        },
      },
    },
  })

  const updates: { id: string; rankScore: number }[] = []
  for (const row of items) {
    const input = rowToArticleScoreInput(row as TimelineRow)
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

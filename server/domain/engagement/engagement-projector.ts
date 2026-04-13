import type { Prisma, PrismaClient } from '@prisma/client'
import type { ArticleEngagementLoggedEvent } from '../events/application-events'
import { applicationEventBus } from '../events/application-events'
import { prisma } from '../../utils/prisma'
import { pointsForEngagementEvent } from './engagement-points'

function normalizeKeys(values: string[] | null | undefined): string[] {
  if (!values || values.length === 0) return []
  const out = new Set<string>()
  for (const raw of values) {
    const v = raw.trim().toLowerCase()
    if (v) out.add(v)
  }
  return [...out]
}

async function applyEventToEngagementAggregates(
  db: PrismaClient,
  e: ArticleEngagementLoggedEvent,
): Promise<void> {
  const delta = pointsForEngagementEvent(e.segment, e.durationSec)
  if (delta.positive <= 0 && delta.negative <= 0) return

  const article = await db.article.findUnique({
    where: { id: e.articleId },
    select: {
      id: true,
      crawlKey: true,
      enrichment: { select: { category: true, tags: true } },
    },
  })
  if (!article) return

  const categories = normalizeKeys(article.enrichment?.category)
  const tags = normalizeKeys(article.enrichment?.tags)

  const tx: Prisma.PrismaPromise<unknown>[] = []

  tx.push(
    db.userFeedEngagement.upsert({
      where: { userId_crawlKey: { userId: e.userId, crawlKey: article.crawlKey } },
      create: {
        userId: e.userId,
        crawlKey: article.crawlKey,
        articleId: article.id,
        posPoints: delta.positive,
        negPoints: delta.negative,
      },
      update: {
        articleId: article.id,
        posPoints: { increment: delta.positive },
        negPoints: { increment: delta.negative },
      },
    }),
  )

  for (const category of categories) {
    tx.push(
      db.userCategoryEngagement.upsert({
        where: { userId_category: { userId: e.userId, category } },
        create: {
          userId: e.userId,
          category,
          posPoints: delta.positive,
          negPoints: delta.negative,
        },
        update: {
          posPoints: { increment: delta.positive },
          negPoints: { increment: delta.negative },
        },
      }),
    )
  }

  for (const tag of tags) {
    tx.push(
      db.userTagEngagement.upsert({
        where: { userId_tag: { userId: e.userId, tag } },
        create: {
          userId: e.userId,
          tag,
          posPoints: delta.positive,
          negPoints: delta.negative,
        },
        update: {
          posPoints: { increment: delta.positive },
          negPoints: { increment: delta.negative },
        },
      }),
    )
  }

  await db.$transaction(tx)
}

let registered = false

/**
 * Register once per server process. Projects domain events into aggregate tables.
 */
export function ensureEngagementProjectorRegistered(): void {
  if (registered) return
  registered = true
  applicationEventBus.onArticleEngagementLogged(async (e) => {
    await applyEventToEngagementAggregates(prisma, e)
  })
}


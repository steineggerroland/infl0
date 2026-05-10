import { createError, defineEventHandler } from 'h3'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

type StatsBucket = {
  inflowCount: number
  readCount: number
  unreadCount: number
  lastReadAt: Date | null
}

/**
 * GET /api/me/feed-stats
 *
 * Per-feed inflow share + read history for the signed-in user. Includes paused
 * subscriptions so the user can still see how much they read of a source they
 * stopped fetching. Computed from `UserTimelineItem` joined to `Article`.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const feeds = await prisma.userFeed.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, crawlKey: true },
  })

  if (feeds.length === 0) {
    return { items: [] as const, totalInflow: 0 }
  }

  const items = await prisma.userTimelineItem.findMany({
    where: { userId },
    select: {
      readAt: true,
      article: { select: { crawlKey: true } },
    },
  })

  const buckets = new Map<string, StatsBucket>()
  for (const it of items) {
    const key = it.article.crawlKey
    const b: StatsBucket = buckets.get(key) ?? {
      inflowCount: 0,
      readCount: 0,
      unreadCount: 0,
      lastReadAt: null,
    }
    b.inflowCount += 1
    if (it.readAt) {
      b.readCount += 1
      if (!b.lastReadAt || it.readAt > b.lastReadAt) b.lastReadAt = it.readAt
    } else {
      b.unreadCount += 1
    }
    buckets.set(key, b)
  }

  const totalInflow = items.length

  const out = feeds.map((f) => {
    const b = buckets.get(f.crawlKey) ?? {
      inflowCount: 0,
      readCount: 0,
      unreadCount: 0,
      lastReadAt: null,
    }
    const sharePercent =
      totalInflow === 0 ? 0 : Math.round((b.inflowCount / totalInflow) * 1000) / 10
    return {
      feedId: f.id,
      crawlKey: f.crawlKey,
      inflowCount: b.inflowCount,
      readCount: b.readCount,
      unreadCount: b.unreadCount,
      sharePercent,
      lastReadAt: b.lastReadAt ? b.lastReadAt.toISOString() : null,
    }
  })

  return { items: out, totalInflow }
})

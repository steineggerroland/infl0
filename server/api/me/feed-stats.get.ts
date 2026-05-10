import { createError, defineEventHandler } from 'h3'
import { Prisma } from '~/generated/prisma/client'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

type AggRow = {
  crawlKey: string
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
 * stopped fetching. Aggregated in PostgreSQL by article crawl_key (no full-row
 * scan into Node).
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

  const aggRows = await prisma.$queryRaw<AggRow[]>(Prisma.sql`
    SELECT
      a.crawl_key AS "crawlKey",
      COUNT(*)::integer AS "inflowCount",
      COUNT(uti.read_at)::integer AS "readCount",
      (COUNT(*) - COUNT(uti.read_at))::integer AS "unreadCount",
      MAX(uti.read_at) AS "lastReadAt"
    FROM user_timeline_items uti
    INNER JOIN articles a ON a.id = uti.article_id
    WHERE uti.user_id = ${userId}::uuid
    GROUP BY a.crawl_key
  `)

  const buckets = new Map(
    aggRows.map((r) => [
      r.crawlKey,
      {
        inflowCount: r.inflowCount,
        readCount: r.readCount,
        unreadCount: r.unreadCount,
        lastReadAt: r.lastReadAt,
      },
    ]),
  )

  const totalInflow = aggRows.reduce((s, r) => s + r.inflowCount, 0)

  const out = feeds.map((f) => {
    const b = buckets.get(f.crawlKey) ?? {
      inflowCount: 0,
      readCount: 0,
      unreadCount: 0,
      lastReadAt: null as Date | null,
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

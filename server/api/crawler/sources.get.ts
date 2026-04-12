import { prisma } from '../../utils/prisma'
import { requireCrawlerAuth } from '../../utils/crawler-auth'

/**
 * GET /api/crawler/sources
 * Header: X-Crawler-Key or Authorization: Bearer <NUXT_CRAWLER_API_KEY>
 *
 * Returns all **active** user feeds, deduplicated by `crawlKey` (one row per source)
 * so n8n can fill the `crawl_sources` data table from infl0.
 */
export default defineEventHandler(async (event) => {
  requireCrawlerAuth(event)

  const active = await prisma.userFeed.findMany({
    where: { active: true },
    orderBy: { updatedAt: 'desc' },
    select: {
      crawlKey: true,
      feedUrl: true,
      displayTitle: true,
    },
  })

  const byKey = new Map<
    string,
    { crawlKey: string; feedUrl: string; displayTitle: string | null; subscriberCount: number }
  >()

  for (const row of active) {
    const existing = byKey.get(row.crawlKey)
    if (existing) {
      existing.subscriberCount += 1
      continue
    }
    byKey.set(row.crawlKey, {
      crawlKey: row.crawlKey,
      feedUrl: row.feedUrl,
      displayTitle: row.displayTitle,
      subscriberCount: 1,
    })
  }

  const sources = [...byKey.values()].sort((a, b) =>
    a.crawlKey.localeCompare(b.crawlKey),
  )

  return {
    ok: true,
    count: sources.length,
    sources: sources.map((s) => ({
      crawlKey: s.crawlKey,
      feedUrl: s.feedUrl,
      displayTitle: s.displayTitle,
      subscriberCount: s.subscriberCount,
    })),
  }
})

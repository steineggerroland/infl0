import { createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireCrawlerAuth } from '../../utils/crawler-auth'
import { ingestFromBody, persistCrawlerIngestFailure } from '../../utils/crawler-ingest'

/**
 * POST /api/crawler/ingest
 * Header: X-Crawler-Key or Authorization: Bearer <NUXT_CRAWLER_API_KEY>
 *
 * Flat JSON per item (TopicKnowledgeCrawler). `item_kind` routes to `articles` or
 * `episodes`; `section` is rejected until long-form sections ship.
 *
 * Related: GET /api/crawler/sources — active feeds (crawlKey) for n8n / data-table sync.
 */
export default defineEventHandler(async (event) => {
  requireCrawlerAuth(event)

  const body = await readBody<Record<string, unknown>>(event).catch(() => null)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Expected JSON body' })
  }

  try {
    const result = await prisma.$transaction((tx) => ingestFromBody(tx, body))
    return {
      ok: true,
      itemKind: result.itemKind,
      articleId: result.itemKind === 'article' ? result.contentId : undefined,
      episodeId: result.itemKind === 'episode' ? result.contentId : undefined,
      timelineInserted: result.timelineInserted,
      subscriberCount: result.subscriberCount,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid ingest payload'
    await persistCrawlerIngestFailure(prisma, body, message).catch(() => undefined)
    if (message.includes('Missing') || message.includes('not supported')) {
      throw createError({ statusCode: 400, statusMessage: message })
    }
    throw e
  }
})

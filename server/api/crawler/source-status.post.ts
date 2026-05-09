import { createError, defineEventHandler, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireCrawlerAuth } from '../../utils/crawler-auth'
import {
  parseSourceStatusUpsertBody,
  SourceStatusPayloadError,
} from '../../utils/source-status-crawler-payload'

/**
 * POST /api/crawler/source-status
 * Header: X-Crawler-Key or Authorization: Bearer <NUXT_CRAWLER_API_KEY>
 *
 * Upserts the latest processing / health snapshot for a normalized `crawlKey`
 * (same key space as `user_feeds.crawl_key` and `POST /api/crawler/ingest`).
 * Body accepts **camelCase** or **snake_case** field names.
 *
 * **Partial payloads:** Only keys present in the JSON are written on update; omitted
 * keys keep their stored values (see `parseSourceStatusUpsertBody` in
 * `server/utils/source-status-crawler-payload.ts`).
 *
 * Related: `GET /api/crawler/sources`, `GET /api/source-statuses` (signed-in read).
 */
export default defineEventHandler(async (event) => {
  requireCrawlerAuth(event)

  const body = await readBody(event).catch(() => null)

  let parsed
  try {
    parsed = parseSourceStatusUpsertBody(body)
  } catch (e) {
    if (e instanceof SourceStatusPayloadError) {
      throw createError({ statusCode: 400, statusMessage: e.message })
    }
    throw e
  }

  const { crawlKey, create, update } = parsed

  await prisma.sourceStatus.upsert({
    where: { crawlKey },
    create,
    update,
  })

  return { ok: true as const, crawlKey }
})

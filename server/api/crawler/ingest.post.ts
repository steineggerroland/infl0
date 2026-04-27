import { createError, readBody } from 'h3'
import { Prisma } from '~/generated/prisma/client'
import { prisma } from '../../utils/prisma'
import { requireCrawlerAuth } from '../../utils/crawler-auth'

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

function parsePublishedAt(v: unknown): Date | null {
  if (v == null) return null
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

function asJson(v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (v === undefined) return undefined
  if (v === null) return Prisma.JsonNull
  return v as Prisma.InputJsonValue
}

/**
 * POST /api/crawler/ingest
 * Header: X-Crawler-Key or Authorization: Bearer <NUXT_CRAWLER_API_KEY>
 *
 * Body:
 * - crawlKey (string, required): normalized feed URL, must match user_feeds.crawl_key
 * - Either flat article fields or { crawlKey, article: { ... } }
 *
 * Article fields align with TopicKnowledgeCrawler processed JSON: id, title, link,
 * author, publishedAt, categories, content_md, source_type, tld, content_hash | hash,
 * teaser, summary_long, category, tags, seriousness_rating
 *
 * Related: GET /api/crawler/sources — active feeds (crawlKey) for n8n / data-table sync.
 */
export default defineEventHandler(async (event) => {
  requireCrawlerAuth(event)

  const body = await readBody<Record<string, unknown>>(event).catch(() => null)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Expected JSON body' })
  }

  const nested = body.article
  const src =
    nested !== null && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : body

  const crawlKey = str(body.crawlKey) ?? str(src.crawlKey)
  if (!crawlKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing crawlKey' })
  }

  const id = str(src.id)
  const title = str(src.title)
  const link = str(src.link)
  if (!id || !title || !link) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required article fields: id, title, link',
    })
  }

  const author = str(src.author)
  const publishedAt = parsePublishedAt(src.publishedAt)
  const contentMd = str(src.content_md) ?? str(src.contentMd)
  const contentHash = str(src.content_hash) ?? str(src.contentHash) ?? str(src.hash)
  const sourceType = str(src.source_type) ?? str(src.sourceType)
  const tld = str(src.tld)
  const categories = asJson(src.categories)

  const teaser = str(src.teaser)
  const summaryLong = str(src.summary_long) ?? str(src.summaryLong)
  const enrichCategory = asStringArray(src.category)
  const tags = asStringArray(src.tags)
  const seriousnessRating =
    str(src.seriousness_rating) ?? str(src.seriousnessRating)

  const hasEnrichment =
    teaser !== undefined ||
    summaryLong !== undefined ||
    enrichCategory.length > 0 ||
    tags.length > 0 ||
    seriousnessRating !== undefined

  const result = await prisma.$transaction(async (tx) => {
    await tx.article.upsert({
      where: { id },
      create: {
        id,
        crawlKey,
        link,
        title,
        author,
        publishedAt,
        contentHash,
        contentMd,
        sourceType,
        tld,
        categories: categories === undefined ? undefined : categories,
      },
      update: {
        crawlKey,
        link,
        title,
        author,
        publishedAt,
        contentHash,
        contentMd,
        sourceType,
        tld,
        ...(categories !== undefined ? { categories } : {}),
        fetchedAt: new Date(),
      },
    })

    if (hasEnrichment) {
      await tx.articleEnrichment.upsert({
        where: { articleId: id },
        create: {
          articleId: id,
          teaser,
          summaryLong,
          category: enrichCategory,
          tags,
          seriousnessRating,
        },
        update: {
          teaser,
          summaryLong,
          category: enrichCategory,
          tags,
          seriousnessRating,
          lastUpdated: new Date(),
        },
      })
    }

    const subscribers = await tx.userFeed.findMany({
      where: { crawlKey, active: true },
      distinct: ['userId'],
      select: { userId: true },
    })

    let timelineInserted = 0
    if (subscribers.length > 0) {
      const res = await tx.userTimelineItem.createMany({
        data: subscribers.map((s) => ({
          userId: s.userId,
          articleId: id,
        })),
        skipDuplicates: true,
      })
      timelineInserted = res.count
    }

    return { timelineInserted, subscriberCount: subscribers.length }
  })

  return {
    ok: true,
    articleId: id,
    timelineInserted: result.timelineInserted,
    subscriberCount: result.subscriberCount,
  }
})

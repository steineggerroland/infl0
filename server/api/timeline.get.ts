import type { Article, ArticleEnrichment } from '@prisma/client'
import { createError, getQuery } from 'h3'
import { prisma } from '../utils/prisma'
import { getSessionUserId } from '../utils/auth-session'

type ArticleWithEnrichment = Article & { enrichment: ArticleEnrichment | null }

/** Article shape usable by ArticleView + index (publishedAt as ISO string). */
function mapArticle(a: ArticleWithEnrichment) {
  const e = a.enrichment
  return {
    id: a.id,
    title: a.title,
    link: a.link,
    author: a.author ?? '',
    publishedAt: (a.publishedAt ?? a.fetchedAt).toISOString(),
    source_type: a.sourceType ?? 'unknown',
    tld: a.tld ?? '',
    teaser: e?.teaser ?? '',
    summary_long: e?.summaryLong ?? '',
    category: e?.category?.length ? e.category : undefined,
    tags: e?.tags ?? [],
    rawMarkdown: a.contentMd ?? undefined,
  }
}

/**
 * GET /api/timeline?limit=20&offset=0
 * Pagination: stable order by article.publishedAt desc, then article.id desc.
 * Requires session cookie (see POST /api/auth/login).
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 20))
  const offset = Math.max(0, Math.min(50_000, Number(q.offset) || 0))

  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!userExists) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const rows = await prisma.userTimelineItem.findMany({
    where: { userId },
    orderBy: [{ article: { publishedAt: 'desc' } }, { article: { id: 'desc' } }],
    skip: offset,
    take: limit + 1,
    include: {
      article: { include: { enrichment: true } },
    },
  })

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  return {
    items: page.map((row) => mapArticle(row.article)),
    hasMore,
  }
})

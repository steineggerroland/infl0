import type { Article, ArticleEnrichment, Prisma } from '~/generated/prisma/client'
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
    fetchedAt: a.fetchedAt.toISOString(),
    source_type: a.sourceType ?? 'unknown',
    tld: a.tld ?? '',
    teaser: e?.teaser ?? '',
    summary_long: e?.summaryLong ?? '',
    category: e?.category?.length ? e.category : undefined,
    tags: e?.tags ?? [],
    rawMarkdown: a.contentMd ?? undefined,
  }
}

function mapTimelineItem(row: {
  insertedAt: Date
  readAt: Date | null
  article: ArticleWithEnrichment
}) {
  return {
    ...mapArticle(row.article),
    insertedAt: row.insertedAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  }
}

function queryShowRead(q: Record<string, unknown>): boolean {
  const v = q.showRead
  if (v === true || v === 1) return true
  if (typeof v === 'string') {
    const s = v.toLowerCase()
    return s === '1' || s === 'true' || s === 'yes'
  }
  return false
}

/**
 * GET /api/timeline?limit=20&offset=0&showRead=1
 * By default, rows with read_at set are omitted. Pass showRead=1 to include them.
 * stats.total / stats.unread help the client show empty states when everything is read.
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 20))
  const offset = Math.max(0, Math.min(50_000, Number(q.offset) || 0))
  const showRead = queryShowRead(q as Record<string, unknown>)

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

  const listWhere: Prisma.UserTimelineItemWhereInput = showRead
    ? { userId }
    : { userId, readAt: null }

  const [totalCount, unreadCount, anyScored] = await Promise.all([
    prisma.userTimelineItem.count({ where: { userId } }),
    prisma.userTimelineItem.count({ where: { userId, readAt: null } }),
    prisma.userTimelineItem.findFirst({
      where: { ...listWhere, rankScore: { not: null } },
      select: { id: true },
    }),
  ])

  const orderBy: Prisma.UserTimelineItemOrderByWithRelationInput[] = anyScored
    ? [
        { rankScore: { sort: 'desc', nulls: 'last' } },
        { article: { publishedAt: 'desc' } },
        { article: { id: 'desc' } },
      ]
    : [{ article: { publishedAt: 'desc' } }, { article: { id: 'desc' } }]

  const rows = await prisma.userTimelineItem.findMany({
    where: listWhere,
    orderBy,
    skip: offset,
    take: limit + 1,
    include: {
      article: { include: { enrichment: true } },
    },
  })

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  return {
    items: page.map((row) => mapTimelineItem(row)),
    hasMore,
    stats: { total: totalCount, unread: unreadCount },
  }
})

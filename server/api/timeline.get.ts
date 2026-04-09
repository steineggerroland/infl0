import type { Article, ArticleEnrichment } from '@prisma/client'
import { getQuery } from 'h3'
import { prisma } from '../utils/prisma'

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
 * GET /api/timeline?limit=30
 * Beta: Nutzer über BETA_SEED_EMAIL (wie prisma/seed).
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 30))

  const email = process.env.BETA_SEED_EMAIL ?? 'beta@localhost'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { user: null, items: [] }
  }

  const rows = await prisma.userTimelineItem.findMany({
    where: { userId: user.id },
    orderBy: { insertedAt: 'desc' },
    take: limit,
    include: {
      article: { include: { enrichment: true } },
    },
  })

  return {
    user: { id: user.id, email: user.email },
    items: rows.map((row) => ({
      insertedAt: row.insertedAt.toISOString(),
      article: mapArticle(row.article),
    })),
  }
})

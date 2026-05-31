import type { Article, ArticleEnrichment, KnowledgeInboxItem, UserFeed, UserTimelineItem } from '~/generated/prisma/client'
import { createError } from 'h3'
import { prisma } from './prisma'

type ArticleWithEnrichment = Article & { enrichment: ArticleEnrichment | null }

type ArticleAccess = {
  article: ArticleWithEnrichment
  timelineItem: Pick<UserTimelineItem, 'readAt'> | null
  inboxItem: Pick<KnowledgeInboxItem, 'id' | 'capturedAt'> | null
  userFeed: Pick<UserFeed, 'displayTitle'> | null
}

export type ArticleDetail = {
  id: string
  title: string
  link: string
  author: string
  publishedAt: string
  fetchedAt: string
  sourceType: string
  sourceTitle: string
  tld: string
  teaser: string
  summaryLong: string
  category?: string[]
  tags: string[]
  rawMarkdown?: string
  crawlKey: string
  readAt: string | null
  saved: { id: string, capturedAt: string } | null
}

export async function loadAccessibleArticle(userId: string, articleId: string): Promise<ArticleAccess> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { enrichment: true },
  })
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  const [timelineItem, inboxItem, userFeed] = await Promise.all([
    prisma.userTimelineItem.findFirst({
      where: { userId, contentKind: 'article', articleId },
      select: { readAt: true },
    }),
    prisma.knowledgeInboxItem.findUnique({
      where: { userId_articleId: { userId, articleId } },
      select: { id: true, capturedAt: true },
    }),
    prisma.userFeed.findFirst({
      where: { userId, crawlKey: article.crawlKey },
      select: { displayTitle: true },
    }),
  ])

  if (!timelineItem && !inboxItem && !userFeed) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  return { article, timelineItem, inboxItem, userFeed }
}

export async function canAccessEpisode(userId: string, episodeId: string): Promise<boolean> {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: { crawlKey: true },
  })
  if (!episode) {
    throw createError({ statusCode: 404, statusMessage: 'Episode not found' })
  }

  const [timelineItem, inboxItem, userFeed] = await Promise.all([
    prisma.userTimelineItem.findFirst({
      where: { userId, contentKind: 'episode', episodeId },
      select: { id: true },
    }),
    prisma.knowledgeInboxItem.findUnique({
      where: { userId_episodeId: { userId, episodeId } },
      select: { id: true },
    }),
    prisma.userFeed.findFirst({
      where: { userId, crawlKey: episode.crawlKey },
      select: { id: true },
    }),
  ])

  return Boolean(timelineItem || inboxItem || userFeed)
}

export function toArticleDetail(access: ArticleAccess): ArticleDetail {
  const { article, timelineItem, inboxItem, userFeed } = access
  const enrichment = article.enrichment
  const sourceTitle = userFeed?.displayTitle?.trim() || article.sourceType || 'unknown'

  return {
    id: article.id,
    title: article.title,
    link: article.link,
    author: article.author ?? '',
    publishedAt: (article.publishedAt ?? article.fetchedAt).toISOString(),
    fetchedAt: article.fetchedAt.toISOString(),
    sourceType: article.sourceType ?? 'unknown',
    sourceTitle,
    tld: article.tld ?? '',
    teaser: enrichment?.teaser ?? '',
    summaryLong: enrichment?.summaryLong ?? '',
    category: enrichment?.category?.length ? enrichment.category : undefined,
    tags: enrichment?.tags ?? [],
    rawMarkdown: article.contentMd ?? undefined,
    crawlKey: article.crawlKey,
    readAt: timelineItem?.readAt?.toISOString() ?? null,
    saved: inboxItem
      ? { id: inboxItem.id, capturedAt: inboxItem.capturedAt.toISOString() }
      : null,
  }
}

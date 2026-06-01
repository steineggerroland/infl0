import type { Article, ArticleEnrichment, Episode, EpisodeEnrichment, KnowledgeInboxItem, UserFeed, UserTimelineItem } from '~/generated/prisma/client'
import { createError } from 'h3'
import { parseEpisodeChapters, type InflowEpisodeChapter } from '../../utils/inflow-episode'
import { prisma } from './prisma'

type ArticleWithEnrichment = Article & { enrichment: ArticleEnrichment | null }
type EpisodeWithEnrichment = Episode & { enrichment: EpisodeEnrichment | null }

type ArticleAccess = {
  article: ArticleWithEnrichment
  timelineItem: Pick<UserTimelineItem, 'readAt'> | null
  inboxItem: Pick<KnowledgeInboxItem, 'id' | 'capturedAt'> | null
  userFeed: Pick<UserFeed, 'displayTitle'> | null
}

type EpisodeAccess = {
  episode: EpisodeWithEnrichment
  timelineItem: Pick<UserTimelineItem, 'readAt'> | null
  inboxItem: Pick<KnowledgeInboxItem, 'id' | 'capturedAt'> | null
  userFeed: Pick<UserFeed, 'displayTitle' | 'feedUrl'> | null
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

export type EpisodeDetail = {
  id: string
  title: string
  link: string
  author: string
  publishedAt: string
  fetchedAt: string
  sourceType: string
  sourceTitle: string
  feedUrl: string | null
  tld: string
  teaser: string
  summaryLong: string
  category?: string[]
  tags: string[]
  rawMarkdown?: string
  crawlKey: string
  readAt: string | null
  saved: { id: string, capturedAt: string } | null
  shownotesMd?: string
  transcriptMd?: string
  transcriptUrl?: string
  mediaUrl?: string
  mediaType?: string
  durationSeconds?: number
  episodeNumber?: number | null
  seasonNumber?: number | null
  episodeType?: string
  explicit?: boolean
  subtitle?: string
  imageUrl?: string
  chapters?: InflowEpisodeChapter[]
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
  try {
    await loadAccessibleEpisode(userId, episodeId)
    return true
  } catch (error) {
    if (typeof error === 'object' && error != null && 'statusCode' in error && error.statusCode === 404) {
      return false
    }
    throw error
  }
}

export async function loadAccessibleEpisode(userId: string, episodeId: string): Promise<EpisodeAccess> {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: { enrichment: true },
  })
  if (!episode) {
    throw createError({ statusCode: 404, statusMessage: 'Episode not found' })
  }

  const [timelineItem, inboxItem, userFeed] = await Promise.all([
    prisma.userTimelineItem.findFirst({
      where: { userId, contentKind: 'episode', episodeId },
      select: { readAt: true },
    }),
    prisma.knowledgeInboxItem.findUnique({
      where: { userId_episodeId: { userId, episodeId } },
      select: { id: true, capturedAt: true },
    }),
    prisma.userFeed.findFirst({
      where: { userId, crawlKey: episode.crawlKey },
      select: { displayTitle: true, feedUrl: true },
    }),
  ])

  if (!timelineItem && !inboxItem && !userFeed) {
    throw createError({ statusCode: 404, statusMessage: 'Episode not found' })
  }

  return { episode, timelineItem, inboxItem, userFeed }
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

export function toEpisodeDetail(access: EpisodeAccess): EpisodeDetail {
  const { episode, timelineItem, inboxItem, userFeed } = access
  const enrichment = episode.enrichment
  const sourceTitle = userFeed?.displayTitle?.trim() || episode.author?.trim() || episode.sourceType || 'unknown'

  return {
    id: episode.id,
    title: episode.title,
    link: episode.link,
    author: episode.author ?? '',
    publishedAt: (episode.publishedAt ?? episode.fetchedAt).toISOString(),
    fetchedAt: episode.fetchedAt.toISOString(),
    sourceType: episode.sourceType ?? 'rss+podcast',
    sourceTitle,
    feedUrl: userFeed?.feedUrl ?? null,
    tld: episode.tld ?? '',
    teaser: enrichment?.teaser ?? '',
    summaryLong: enrichment?.summaryLong ?? '',
    category: enrichment?.category?.length ? enrichment.category : undefined,
    tags: enrichment?.tags ?? [],
    rawMarkdown: episode.contentMd ?? undefined,
    crawlKey: episode.crawlKey,
    readAt: timelineItem?.readAt?.toISOString() ?? null,
    saved: inboxItem
      ? { id: inboxItem.id, capturedAt: inboxItem.capturedAt.toISOString() }
      : null,
    shownotesMd: episode.shownotesMd ?? undefined,
    transcriptMd: episode.transcriptMd ?? undefined,
    transcriptUrl: episode.transcriptUrl ?? undefined,
    mediaUrl: episode.mediaUrl ?? undefined,
    mediaType: episode.mediaType ?? undefined,
    durationSeconds: episode.durationSeconds ?? undefined,
    episodeNumber: episode.episodeNumber,
    seasonNumber: episode.seasonNumber,
    episodeType: episode.episodeType ?? undefined,
    explicit: episode.explicit ?? undefined,
    subtitle: episode.subtitle ?? undefined,
    imageUrl: episode.imageUrl ?? undefined,
    chapters: parseEpisodeChapters(episode.chapters),
  }
}

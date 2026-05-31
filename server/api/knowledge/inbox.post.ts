import { createError, defineEventHandler, readBody } from 'h3'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'
import { canAccessEpisode, loadAccessibleArticle } from '../../utils/content-access'

type Body = {
  articleId?: unknown
  episodeId?: unknown
}

/**
 * POST /api/knowledge/inbox
 *
 * Saves an article or episode to the user's knowledge inbox with a metadata snapshot.
 * Returns the created KnowledgeInboxItem.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = (await readBody(event).catch(() => null)) as Body | null
  if (body == null || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Expected JSON body' })
  }

  const articleId = typeof body.articleId === 'string' ? body.articleId.trim() : ''
  const episodeId = typeof body.episodeId === 'string' ? body.episodeId.trim() : ''

  if (!articleId && !episodeId) {
    throw createError({ statusCode: 400, statusMessage: 'articleId or episodeId required' })
  }

  if (articleId) {
    const existing = await prisma.knowledgeInboxItem.findUnique({
      where: { userId_articleId: { userId, articleId } },
    })
    if (existing) {
      return existing
    }

    const { article, userFeed } = await loadAccessibleArticle(userId, articleId)
    const titleSnapshot = article.title
    const sourceSnapshot = userFeed?.displayTitle?.trim() || article.sourceType || 'unknown'
    const teaserSnapshot = (article.enrichment?.teaser || '').slice(0, 200)

    const item = await prisma.knowledgeInboxItem.create({
      data: {
        userId,
        contentKind: 'article',
        articleId,
        titleSnapshot,
        sourceSnapshot,
        teaserSnapshot,
      },
    })

    return item
  }

  if (episodeId) {
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: { enrichment: true },
    })
    if (!episode) {
      throw createError({ statusCode: 404, statusMessage: 'Episode not found' })
    }

    const canAccess = await canAccessEpisode(userId, episodeId)
    if (!canAccess) {
      throw createError({ statusCode: 404, statusMessage: 'Episode not found' })
    }

    const userFeed = await prisma.userFeed.findFirst({
      where: { userId, crawlKey: episode.crawlKey },
      select: { displayTitle: true },
    })

    const titleSnapshot = episode.title
    const sourceSnapshot = userFeed?.displayTitle?.trim() || episode.sourceType || 'unknown'
    const teaserSnapshot = (episode.enrichment?.teaser || '').slice(0, 200)

    const existing = await prisma.knowledgeInboxItem.findUnique({
      where: { userId_episodeId: { userId, episodeId } },
    })
    if (existing) {
      return existing
    }

    const item = await prisma.knowledgeInboxItem.create({
      data: {
        userId,
        contentKind: 'episode',
        episodeId,
        titleSnapshot,
        sourceSnapshot,
        teaserSnapshot,
      },
    })

    return item
  }
})

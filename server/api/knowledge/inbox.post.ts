import { createError, defineEventHandler, readBody } from 'h3'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

type Body = {
  articleId?: unknown
}

/**
 * POST /api/knowledge/inbox
 *
 * Saves an article to the user's knowledge inbox with a metadata snapshot.
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
  if (!articleId) {
    throw createError({ statusCode: 400, statusMessage: 'articleId required' })
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { enrichment: true },
  })
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }

  const userFeed = await prisma.userFeed.findFirst({
    where: { userId, crawlKey: article.crawlKey },
    select: { displayTitle: true },
  })

  const titleSnapshot = article.title
  const sourceSnapshot = userFeed?.displayTitle?.trim() || article.sourceType || 'unknown'
  const teaserSnapshot = (article.enrichment?.teaser || '').slice(0, 200)

  const existing = await prisma.knowledgeInboxItem.findUnique({
    where: { userId_articleId: { userId, articleId } },
  })
  if (existing) {
    return existing
  }

  const item = await prisma.knowledgeInboxItem.create({
    data: {
      userId,
      articleId,
      titleSnapshot,
      sourceSnapshot,
      teaserSnapshot,
    },
  })

  return item
})

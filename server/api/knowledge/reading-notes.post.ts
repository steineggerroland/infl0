import { createError, defineEventHandler, readBody } from 'h3'
import { normalizeReadingNoteTags } from '../../../utils/reading-note-tags'
import { getSessionUserId } from '../../utils/auth-session'
import { canAccessEpisode, loadAccessibleArticle } from '../../utils/content-access'
import { prisma } from '../../utils/prisma'

type Body = {
  articleId?: string
  episodeId?: string
  type: 'quote' | 'summary' | 'note'
  content: string
  context?: string
  tags?: string[]
  anchorText?: string
  anchorStartOffset?: number
  contentSource?: string
}

const contentSources = new Set(['body', 'shownotes', 'transcript'])

export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body: Body = await readBody(event)
  const content = body.content?.trim()
  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'Content is required' })
  }
  if (!body.type || !['quote', 'summary', 'note'].includes(body.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or missing reading note type' })
  }
  if (Boolean(body.articleId) === Boolean(body.episodeId)) {
    throw createError({ statusCode: 400, statusMessage: 'Exactly one of articleId or episodeId is required' })
  }
  const contentSource = body.contentSource?.trim() || 'body'
  if (!contentSources.has(contentSource)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid contentSource' })
  }

  if (body.articleId && !await loadAccessibleArticle(userId, body.articleId)) {
    throw createError({ statusCode: 403, statusMessage: 'Article not found or access denied' })
  }
  if (body.episodeId && !await canAccessEpisode(userId, body.episodeId)) {
    throw createError({ statusCode: 403, statusMessage: 'Episode not found or access denied' })
  }

  return prisma.readingNote.create({
    data: {
      userId,
      articleId: body.articleId ?? null,
      episodeId: body.episodeId ?? null,
      type: body.type,
      content,
      context: body.context?.trim() || null,
      userTags: normalizeReadingNoteTags(body.tags),
      anchorText: body.anchorText?.trim() || null,
      anchorStartOffset: Number.isInteger(body.anchorStartOffset) && body.anchorStartOffset! >= 0
        ? body.anchorStartOffset
        : null,
      contentSource,
    },
  })
})

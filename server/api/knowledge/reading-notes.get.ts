import { createError, defineEventHandler, getQuery } from 'h3'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const parsedLimit = Number.parseInt(query.limit as string)
  const parsedOffset = Number.parseInt(query.offset as string)
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 100
  const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0
  const where: {
    userId: string
    articleId?: string
    episodeId?: string
    contentSource?: string
    userTags?: { has: string }
  } = { userId }

  if (query.articleId) where.articleId = String(query.articleId)
  if (query.episodeId) where.episodeId = String(query.episodeId)
  if (query.contentSource) where.contentSource = String(query.contentSource)
  if (query.tag) where.userTags = { has: String(query.tag).trim().toLowerCase() }

  const [items, total] = await Promise.all([
    prisma.readingNote.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.readingNote.count({ where }),
  ])

  return { items, total, hasMore: offset + items.length < total }
})

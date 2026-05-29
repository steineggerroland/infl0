import { createError, defineEventHandler, getQuery } from 'h3'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

/**
 * GET /api/knowledge/inbox
 *
 * Lists all inbox items for the current user in reverse chronological order.
 * Supports optional `limit` and `offset` for pagination.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = typeof query.limit === 'string' ? Math.min(Number.parseInt(query.limit, 10) || 50, 100) : 50
  const offset = typeof query.offset === 'string' ? Math.max(Number.parseInt(query.offset, 10) || 0, 0) : 0

  const [items, total] = await Promise.all([
    prisma.knowledgeInboxItem.findMany({
      where: { userId },
      orderBy: { capturedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.knowledgeInboxItem.count({ where: { userId } }),
  ])

  return {
    items,
    total,
    hasMore: offset + items.length < total,
  }
})

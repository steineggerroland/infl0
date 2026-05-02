import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getSessionUserId } from '../../../../utils/auth-session'
import { prisma } from '../../../../utils/prisma'

type Body = {
  read?: unknown
}

/**
 * PATCH /api/me/articles/:articleId/read-state
 * Sets or clears the user's timeline read state independently from engagement tracking.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const articleId = (getRouterParam(event, 'articleId') ?? '').trim()
  if (!articleId) {
    throw createError({ statusCode: 400, statusMessage: 'articleId required' })
  }

  const body = (await readBody(event).catch(() => null)) as Body | null
  if (body == null || typeof body !== 'object' || typeof body.read !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'read boolean required' })
  }

  const timelineRow = await prisma.userTimelineItem.findUnique({
    where: {
      userId_articleId: { userId, articleId },
    },
    select: { id: true, readAt: true },
  })
  if (!timelineRow) {
    throw createError({ statusCode: 404, statusMessage: 'Article not on your timeline' })
  }

  if (body.read && timelineRow.readAt != null) {
    return { ok: true as const, readAt: timelineRow.readAt.toISOString() }
  }
  if (!body.read && timelineRow.readAt == null) {
    return { ok: true as const, readAt: null }
  }

  const readAt = body.read ? new Date() : null
  const updated = await prisma.userTimelineItem.update({
    where: { id: timelineRow.id },
    data: { readAt },
    select: { readAt: true },
  })

  return { ok: true as const, readAt: updated.readAt?.toISOString() ?? null }
})

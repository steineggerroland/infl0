import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import { getSessionUserId } from '../../../../utils/auth-session'
import { queryShowRead } from '../../../../utils/inflow-handler'
import { prisma } from '../../../../utils/prisma'

/**
 * GET /api/me/articles/:articleId/resume-eligibility?showRead=…
 *
 * Whether the stored resume anchor would appear in the user's inflow under the
 * same filter as GET /api/inflow (unread-only vs include read). Used so we do
 * not offer “resume” when the anchor row exists but is filtered out as read.
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

  const q = getQuery(event)
  const showRead = queryShowRead(q as Record<string, unknown>)

  const row = await prisma.userTimelineItem.findUnique({
    where: {
      userId_articleId: { userId, articleId },
    },
    select: { readAt: true },
  })

  if (!row) {
    return { eligible: false as const }
  }

  const eligible = showRead || row.readAt == null
  return { eligible }
})

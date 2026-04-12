import { createError } from 'h3'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

/**
 * GET /api/me/engagement-tracking
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { engagementTrackingEnabled: true },
  })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return { enabled: user.engagementTrackingEnabled }
})

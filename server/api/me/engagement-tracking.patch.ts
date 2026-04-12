import { createError, readBody } from 'h3'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

type Body = { enabled?: unknown }

/**
 * PATCH /api/me/engagement-tracking
 * Body: { enabled: boolean }
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = (await readBody(event).catch(() => null)) as Body | null
  if (body == null || typeof body !== 'object' || typeof body.enabled !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Body must include enabled: boolean' })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { engagementTrackingEnabled: body.enabled },
    select: { engagementTrackingEnabled: true },
  })

  return { enabled: user.engagementTrackingEnabled }
})

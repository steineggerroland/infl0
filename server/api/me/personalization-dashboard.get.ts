import { createError } from 'h3'
import { buildPersonalizationDashboardPayload } from '../../domain/personalization/personalization-dashboard'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

/**
 * GET /api/me/personalization-dashboard
 * Explainability payload: prefs, engagement pies, timeline rows with score breakdown.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const payload = await buildPersonalizationDashboardPayload(prisma, userId)
  if (!payload) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return payload
})

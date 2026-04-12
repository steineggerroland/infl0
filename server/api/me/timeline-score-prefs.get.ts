import { createError } from 'h3'
import { TIMELINE_SCORE_VERSION } from '../../../utils/timeline-score-factors'
import { resolveTimelineScorePrefs } from '../../../utils/timeline-score-prefs-merge'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

/**
 * GET /api/me/timeline-score-prefs
 * Returns merged weights + contentLengthPreference (defaults if unset).
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timelineScorePrefs: true },
  })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const resolved = resolveTimelineScorePrefs(user.timelineScorePrefs)
  return {
    version: TIMELINE_SCORE_VERSION,
    weights: resolved.weights,
    contentLengthPreference: resolved.contentLengthPreference,
  }
})

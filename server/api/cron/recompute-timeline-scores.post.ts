import { createError, getHeader } from 'h3'
import { prisma } from '../../utils/prisma'
import { recomputeTimelineScoresForAllUsers } from '../../utils/recompute-timeline-scores'

/**
 * POST /api/cron/recompute-timeline-scores
 * Header: x-infl0-cron-key: <NUXT_TIMELINE_SCORE_CRON_SECRET>
 * Recomputes rank_score for all users (periodic job).
 */
export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const secret = cfg.timelineScoreCronSecret as string
  if (!secret || secret.length < 8) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Timeline score cron is not configured',
    })
  }
  const key = getHeader(event, 'x-infl0-cron-key')
  if (key !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const result = await recomputeTimelineScoresForAllUsers(prisma)
  return { ok: true, ...result }
})

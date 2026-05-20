import { prisma } from '../../utils/prisma'
import { requireCrawlerAuth } from '../../utils/crawler-auth'
import { recomputeTimelineScoresForAllUsers } from '../../utils/recompute-timeline-scores'

/**
 * POST /api/cron/recompute-timeline-scores
 * Header: X-Crawler-Key, x-infl0-cron-key, or Authorization: Bearer <NUXT_CRAWLER_API_KEY>
 * Recomputes rank_score for all users (periodic job).
 */
export default defineEventHandler(async (event) => {
  requireCrawlerAuth(event, { extraHeaderNames: ['x-infl0-cron-key'] })

  const result = await recomputeTimelineScoresForAllUsers(prisma)
  return { ok: true, ...result }
})

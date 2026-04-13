/**
 * Rebuild engagement aggregate tables from raw article_engagement_events.
 *
 * This is intentionally manual (heavy operation):
 *   nvm use && npm run backfillEngagementAggregates
 *
 * Optional:
 *   RECOMPUTE_TIMELINE_AFTER_BACKFILL=1 npm run backfillEngagementAggregates
 */
import { PrismaClient } from '@prisma/client'
import { rebuildEngagementAggregates } from '../server/domain/engagement/engagement-aggregates-backfill.js'
import { recomputeTimelineScoresForAllUsers } from '../server/utils/recompute-timeline-scores.js'

async function main() {
  const db = new PrismaClient()
  try {
    const rebuilt = await rebuildEngagementAggregates(db)
    let recomputed: { users: number; items: number } | null = null
    if (process.env.RECOMPUTE_TIMELINE_AFTER_BACKFILL === '1') {
      recomputed = await recomputeTimelineScoresForAllUsers(db)
    }
    console.log(
      JSON.stringify(
        {
          rebuilt,
          recomputed,
        },
        null,
        2,
      ),
    )
  } finally {
    await db.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


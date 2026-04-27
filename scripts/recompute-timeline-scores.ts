/**
 * Recompute materialized rank_score for all users' timeline rows.
 *
 * Requires DATABASE_URL and migrated schema (timeline_score_prefs migration).
 *
 *   nvm use && npm run recomputeTimelineScores
 */
import { createScriptPrismaClient } from '../prisma/prisma-client'
import { recomputeTimelineScoresForAllUsers } from '../server/utils/recompute-timeline-scores.js'

async function main() {
  const prisma = createScriptPrismaClient()
  try {
    const r = await recomputeTimelineScoresForAllUsers(prisma)
    console.log(JSON.stringify(r, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

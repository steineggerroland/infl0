import { createError, defineEventHandler } from 'h3'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

/**
 * GET /api/knowledge/tags
 *
 * Lists all tags used by the current user across their reading notes,
 * sorted by usage count (descending).
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const tagCounts = await prisma.$queryRaw`
    SELECT tag, COUNT(*) AS count
    FROM (
      SELECT unnest(user_tags) AS tag
      FROM reading_notes
      WHERE user_id = ${userId}
    ) AS tags
    GROUP BY tag
    ORDER BY count DESC, tag ASC
  `

  return (tagCounts as Array<{ tag: string; count: bigint }>).map((row) => ({
    tag: row.tag,
    count: Number(row.count),
  }))
})

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { getSessionUserId } from '../../../utils/auth-session'
import { recomputeTimelineScoresForUser } from '../../../utils/recompute-timeline-scores'
import { validateSourcePreference } from '../../../../utils/timeline-score-factors'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

/**
 * PATCH /api/feeds/:id/preference
 *
 * Body: `{ value: number }` — must be on the −1 … +1 / 0.25 grid. Updates
 * `UserFeed.userPreferenceWeight` and recomputes the user's timeline scores
 * so the change is felt on the next inflow refresh.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id') ?? ''
  if (!UUID_RE.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid feed id' })
  }

  const body = (await readBody(event).catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Body required' })
  }

  const value = validateSourcePreference(body.value)
  if (value === null) {
    throw createError({
      statusCode: 400,
      statusMessage: 'value must be a number in [-1, 1] in 0.25 steps',
    })
  }

  const owned = await prisma.userFeed.findFirst({
    where: { id, userId },
    select: { id: true, crawlKey: true },
  })
  if (!owned) {
    throw createError({ statusCode: 404, statusMessage: 'Feed not found' })
  }

  const updated = await prisma.userFeed.update({
    where: { id },
    data: { userPreferenceWeight: value },
    select: { id: true, userPreferenceWeight: true },
  })

  await recomputeTimelineScoresForUser(prisma, userId, {
    crawlKeys: [owned.crawlKey],
  })

  return {
    feedId: updated.id,
    userPreferenceWeight: updated.userPreferenceWeight,
  }
})

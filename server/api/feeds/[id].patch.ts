import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { getSessionUserId } from '../../utils/auth-session'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

/**
 * PATCH /api/feeds/:id
 *
 * Currently supports a single editable field — `active` — which toggles
 * whether the source is fetched and shown in the inflow. Pausing keeps the
 * subscription (so weighting / stats survive) but flips the visibility used
 * by `GET /api/feeds`, `GET /api/source-statuses`, and the inflow query.
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

  if (!('active' in body) || typeof body.active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'active (boolean) required' })
  }

  const owned = await prisma.userFeed.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!owned) {
    throw createError({ statusCode: 404, statusMessage: 'Feed not found' })
  }

  const updated = await prisma.userFeed.update({
    where: { id },
    data: { active: body.active },
    select: {
      id: true,
      feedUrl: true,
      crawlKey: true,
      displayTitle: true,
      active: true,
      createdAt: true,
    },
  })

  return {
    feed: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    },
  }
})

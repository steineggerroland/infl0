import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/prisma'
import { getSessionUserId } from '../../utils/auth-session'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id') ?? ''
  if (!UUID_RE.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid feed id' })
  }

  const res = await prisma.userFeed.deleteMany({
    where: { id, userId },
  })

  if (res.count === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Feed not found' })
  }

  return { ok: true }
})

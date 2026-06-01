import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getSessionUserId } from '../../../utils/auth-session'
import { prisma } from '../../../utils/prisma'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

/**
 * DELETE /api/knowledge/inbox/:id
 *
 * Removes an item from the knowledge inbox. Does not delete the original article.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id') ?? ''
  if (!UUID_RE.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid inbox item id' })
  }

  const item = await prisma.knowledgeInboxItem.findUnique({
    where: { id },
    select: { userId: true },
  })
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Inbox item not found' })
  }
  if (item.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  await prisma.knowledgeInboxItem.delete({ where: { id } })

  return { ok: true }
})

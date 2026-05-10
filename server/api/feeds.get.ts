import { createError } from 'h3'
import { prisma } from '../utils/prisma'
import { getSessionUserId } from '../utils/auth-session'

export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Includes paused (`active = false`) subscriptions so /feeds can show them
  // with a Resume action. Inflow / crawler queries still filter on `active`.
  const feeds = await prisma.userFeed.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
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
    feeds: feeds.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
    })),
  }
})

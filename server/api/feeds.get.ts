import { createError } from 'h3'
import { prisma } from '../utils/prisma'
import { getSessionUserId } from '../utils/auth-session'

export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const feeds = await prisma.userFeed.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      feedUrl: true,
      crawlKey: true,
      displayTitle: true,
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

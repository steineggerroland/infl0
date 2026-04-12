import { createError, readBody } from 'h3'
import { prisma } from '../utils/prisma'
import { getSessionUserId } from '../utils/auth-session'
import { normalizeFeedUrl } from '../utils/feed-url'
import { recomputeTimelineScoresForUser } from '../utils/recompute-timeline-scores'

export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event).catch(() => null)
  const feedUrlRaw = typeof body?.feedUrl === 'string' ? body.feedUrl.trim() : ''
  const displayTitle =
    typeof body?.displayTitle === 'string' ? body.displayTitle.trim().slice(0, 120) : ''

  if (!feedUrlRaw) {
    throw createError({ statusCode: 400, statusMessage: 'feedUrl required' })
  }

  let crawlKey: string
  try {
    crawlKey = normalizeFeedUrl(feedUrlRaw)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid feed URL' })
  }

  const existing = await prisma.userFeed.findFirst({
    where: { userId, crawlKey, active: true },
    select: { id: true },
  })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'This source is already in your list' })
  }

  const feed = await prisma.userFeed.create({
    data: {
      userId,
      feedUrl: feedUrlRaw,
      crawlKey,
      displayTitle: displayTitle || null,
    },
    select: {
      id: true,
      feedUrl: true,
      crawlKey: true,
      displayTitle: true,
      createdAt: true,
    },
  })

  await recomputeTimelineScoresForUser(prisma, userId)

  return {
    feed: {
      ...feed,
      createdAt: feed.createdAt.toISOString(),
    },
  }
})

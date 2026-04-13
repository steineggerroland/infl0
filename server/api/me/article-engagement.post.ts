import { createError, readBody } from 'h3'
import {
  ARTICLE_ENGAGEMENT_MAX_DURATION_SEC,
  ARTICLE_READ_ENGAGED_SECONDS_THRESHOLD,
  isArticleEngagementSegment,
} from '../../../utils/article-engagement'
import { applicationEventBus } from '../../domain/events/application-events'
import { ensureEngagementProjectorRegistered } from '../../domain/engagement/engagement-projector'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

type Body = {
  articleId?: unknown
  segment?: unknown
  durationSec?: unknown
}

/**
 * POST /api/me/article-engagement
 * Records one dwell session when the user leaves a segment (teaser / summary / body).
 */
export default defineEventHandler(async (event) => {
  ensureEngagementProjectorRegistered()
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { engagementTrackingEnabled: true },
  })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!user.engagementTrackingEnabled) {
    return { ok: true, ignored: true as const }
  }

  const body = (await readBody(event).catch(() => null)) as Body | null
  if (body == null || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Expected JSON body' })
  }

  const articleId = typeof body.articleId === 'string' ? body.articleId.trim() : ''
  const segment = typeof body.segment === 'string' ? body.segment.trim() : ''
  const durationRaw = body.durationSec

  if (!articleId) {
    throw createError({ statusCode: 400, statusMessage: 'articleId required' })
  }
  if (!isArticleEngagementSegment(segment)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid segment' })
  }

  const durationSec =
    typeof durationRaw === 'number' && Number.isFinite(durationRaw)
      ? durationRaw
      : typeof durationRaw === 'string'
        ? Number.parseFloat(durationRaw)
        : Number.NaN

  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'durationSec must be a positive number' })
  }

  const capped = Math.min(durationSec, ARTICLE_ENGAGEMENT_MAX_DURATION_SEC)

  const timelineRow = await prisma.userTimelineItem.findUnique({
    where: {
      userId_articleId: { userId, articleId },
    },
    select: { id: true, readAt: true, engagedSeconds: true },
  })
  if (!timelineRow) {
    throw createError({ statusCode: 404, statusMessage: 'Article not on your timeline' })
  }

  const newEngaged = timelineRow.engagedSeconds + capped

  await prisma.$transaction([
    prisma.articleEngagementEvent.create({
      data: {
        userId,
        articleId,
        segment,
        durationSec: capped,
      },
    }),
    prisma.userTimelineItem.update({
      where: { id: timelineRow.id },
      data: {
        engagedSeconds: newEngaged,
        ...(timelineRow.readAt == null && newEngaged >= ARTICLE_READ_ENGAGED_SECONDS_THRESHOLD
          ? { readAt: new Date() }
          : {}),
      },
    }),
  ])

  await applicationEventBus.emit({
    type: 'engagement.article.logged',
    userId,
    articleId,
    segment,
    durationSec: capped,
    occurredAt: new Date(),
  })

  return {
    ok: true,
    readMarked: timelineRow.readAt == null && newEngaged >= ARTICLE_READ_ENGAGED_SECONDS_THRESHOLD,
  }
})

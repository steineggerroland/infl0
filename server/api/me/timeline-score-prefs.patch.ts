import { Prisma } from '@prisma/client'
import { createError, readBody } from 'h3'
import { TIMELINE_SCORE_VERSION, clampContentLengthPreference, clampWeight } from '../../../utils/timeline-score-factors'
import {
  isTimelineScoreFactorId,
  resolveTimelineScorePrefs,
  type TimelineScorePrefsStored,
} from '../../../utils/timeline-score-prefs-merge'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'
import { recomputeTimelineScoresForUser } from '../../utils/recompute-timeline-scores'

type PatchBody = {
  reset?: boolean
  weights?: Record<string, unknown>
  contentLengthPreference?: unknown
}

function toStoredJson(p: TimelineScorePrefsStored): Prisma.InputJsonValue {
  return p as unknown as Prisma.InputJsonValue
}

/**
 * PATCH /api/me/timeline-score-prefs
 * Body: { reset?: true } | { weights?: partial, contentLengthPreference?: number }
 * Persists prefs and recomputes rank_score for this user's timeline rows.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = (await readBody(event).catch(() => null)) as PatchBody | null
  if (body == null || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Expected JSON body' })
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { timelineScorePrefs: true },
  })
  if (!existing) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (body.reset === true) {
    await prisma.user.update({
      where: { id: userId },
      data: { timelineScorePrefs: Prisma.JsonNull },
    })
  } else {
    const base = resolveTimelineScorePrefs(existing.timelineScorePrefs)
    const weights = { ...base.weights }
    if (body.weights != null && typeof body.weights === 'object' && !Array.isArray(body.weights)) {
      for (const [key, val] of Object.entries(body.weights)) {
        if (!isTimelineScoreFactorId(key)) continue
        if (typeof val === 'number') weights[key] = clampWeight(val)
      }
    }
    let contentLengthPreference = base.contentLengthPreference
    if (typeof body.contentLengthPreference === 'number') {
      contentLengthPreference = clampContentLengthPreference(body.contentLengthPreference)
    }
    const stored: TimelineScorePrefsStored = {
      v: TIMELINE_SCORE_VERSION,
      weights,
      contentLengthPreference,
    }
    await prisma.user.update({
      where: { id: userId },
      data: { timelineScorePrefs: toStoredJson(stored) },
    })
  }

  await recomputeTimelineScoresForUser(prisma, userId)

  const userAfter = await prisma.user.findUnique({
    where: { id: userId },
    select: { timelineScorePrefs: true },
  })
  const resolved = resolveTimelineScorePrefs(userAfter?.timelineScorePrefs)
  return {
    version: TIMELINE_SCORE_VERSION,
    weights: resolved.weights,
    contentLengthPreference: resolved.contentLengthPreference,
  }
})

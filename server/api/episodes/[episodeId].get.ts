import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getSessionUserId } from '../../utils/auth-session'
import { loadAccessibleEpisode, toEpisodeDetail } from '../../utils/content-access'

/**
 * GET /api/episodes/:episodeId
 *
 * Stable episode-centered detail endpoint. Access is user-scoped: the episode
 * must be in the user's timeline, saved inbox, or one of their subscribed feeds.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const episodeId = (getRouterParam(event, 'episodeId') ?? '').trim()
  if (!episodeId) {
    throw createError({ statusCode: 400, statusMessage: 'episodeId required' })
  }

  const access = await loadAccessibleEpisode(userId, episodeId)
  return toEpisodeDetail(access)
})

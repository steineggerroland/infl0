import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getSessionUserId } from '../../utils/auth-session'
import { loadAccessibleArticle, toArticleDetail } from '../../utils/content-access'

/**
 * GET /api/articles/:articleId
 *
 * Stable article-centered detail endpoint. Access is user-scoped: the article
 * must be in the user's timeline, saved inbox, or one of their subscribed feeds.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const articleId = (getRouterParam(event, 'articleId') ?? '').trim()
  if (!articleId) {
    throw createError({ statusCode: 400, statusMessage: 'articleId required' })
  }

  const access = await loadAccessibleArticle(userId, articleId)
  return toArticleDetail(access)
})

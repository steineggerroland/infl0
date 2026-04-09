import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'

/**
 * Validates X-Crawler-Key or Authorization: Bearer <key> against runtimeConfig.crawlerApiKey.
 * Set NUXT_CRAWLER_API_KEY in env (maps to runtimeConfig).
 */
export function requireCrawlerAuth(event: H3Event) {
  const config = useRuntimeConfig(event)
  const expected = config.crawlerApiKey
  if (!expected) {
    throw createError({ statusCode: 503, statusMessage: 'Crawler API not configured' })
  }

  const headerKey = getHeader(event, 'x-crawler-key')
  const auth = getHeader(event, 'authorization')
  const bearer =
    auth?.startsWith('Bearer ') ? auth.slice(7).trim() : undefined

  const provided = headerKey ?? bearer
  if (!provided || provided !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

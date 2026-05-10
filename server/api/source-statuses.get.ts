import { createError, defineEventHandler } from 'h3'
import { getSessionUserId } from '../utils/auth-session'
import { prisma } from '../utils/prisma'

function serializeStatus(row: {
  crawlKey: string
  sourceStatus: string | null
  sourceHealthStatus: string | null
  sourceHealthReason: string | null
  sourceHealthJson: unknown
  operatorAttention: boolean
  operatorAttentionReason: string | null
  lastCrawlStatus: string | null
  lastCrawlStartedAt: Date | null
  lastCrawlFinishedAt: Date | null
  nextAllowedCrawlAt: Date | null
  lastSuccessfulCrawlAt: Date | null
  lastCrawlError: string | null
  crawlCandidateCount: number | null
  crawlSkippedCount: number | null
  crawlProcessedCount: number | null
  crawlUnchangedCount: number | null
  crawlFetchErrorCount: number | null
  crawlLlmFailedCount: number | null
  consecutiveErrorCount: number | null
  detectedPolicy: unknown
  effectivePolicy: unknown
  createdAt: Date
  updatedAt: Date
}) {
  return {
    crawlKey: row.crawlKey,
    sourceStatus: row.sourceStatus,
    sourceHealthStatus: row.sourceHealthStatus,
    sourceHealthReason: row.sourceHealthReason,
    sourceHealthJson: row.sourceHealthJson,
    operatorAttention: row.operatorAttention,
    operatorAttentionReason: row.operatorAttentionReason,
    lastCrawlStatus: row.lastCrawlStatus,
    lastCrawlStartedAt: row.lastCrawlStartedAt?.toISOString() ?? null,
    lastCrawlFinishedAt: row.lastCrawlFinishedAt?.toISOString() ?? null,
    nextAllowedCrawlAt: row.nextAllowedCrawlAt?.toISOString() ?? null,
    lastSuccessfulCrawlAt: row.lastSuccessfulCrawlAt?.toISOString() ?? null,
    lastCrawlError: row.lastCrawlError,
    crawlCandidateCount: row.crawlCandidateCount,
    crawlSkippedCount: row.crawlSkippedCount,
    crawlProcessedCount: row.crawlProcessedCount,
    crawlUnchangedCount: row.crawlUnchangedCount,
    crawlFetchErrorCount: row.crawlFetchErrorCount,
    crawlLlmFailedCount: row.crawlLlmFailedCount,
    consecutiveErrorCount: row.consecutiveErrorCount,
    detectedPolicy: row.detectedPolicy,
    effectivePolicy: row.effectivePolicy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/**
 * GET /api/source-statuses
 * Session cookie: same auth as other `/api/me/*` routes.
 *
 * Returns one entry per **active** `UserFeed`, joined with `SourceStatus` on
 * `crawlKey`. `latest` is `null` when the crawler has not posted a row yet.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Includes paused (`active = false`) subscriptions so /feeds can render the
  // matching health row + a Resume control.
  const feeds = await prisma.userFeed.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      feedUrl: true,
      crawlKey: true,
      displayTitle: true,
      active: true,
      userPreferenceWeight: true,
    },
  })

  const keys = [...new Set(feeds.map((f) => f.crawlKey))]
  const statuses =
    keys.length === 0
      ? []
      : await prisma.sourceStatus.findMany({
          where: { crawlKey: { in: keys } },
        })

  const byKey = new Map(statuses.map((s) => [s.crawlKey, s]))

  return {
    items: feeds.map((f) => ({
      feed: {
        id: f.id,
        feedUrl: f.feedUrl,
        crawlKey: f.crawlKey,
        displayTitle: f.displayTitle,
        active: f.active,
        userPreferenceWeight: f.userPreferenceWeight,
      },
      latest: byKey.has(f.crawlKey) ? serializeStatus(byKey.get(f.crawlKey)!) : null,
    })),
  }
})

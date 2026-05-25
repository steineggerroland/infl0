import type { TkcSourceHealthStatus } from '../../utils/source-health-display'
import { TKC_SOURCE_HEALTH_STATUSES } from '../../utils/source-health-display'
import { seedSourceStatusFeedUrl } from '../../utils/source-status-seed-urls'

/** Same `crawlKey` as `npm run db:seed` for username `dev` (TKC matrix). */
export function crawlKeyForTkcHealth(health: TkcSourceHealthStatus): string {
  return seedSourceStatusFeedUrl(health)
}

export function contractUserFeedsInTkcOrder() {
  return TKC_SOURCE_HEALTH_STATUSES.map((health) => ({
    id: `fixture-feed-${health}`,
    feedUrl: crawlKeyForTkcHealth(health),
    crawlKey: crawlKeyForTkcHealth(health),
    displayTitle: `Fixture · ${health}`,
  }))
}

/** Minimal Prisma-like SourceStatus row for mocks (GET handler passes through serialize). */
export function contractSourceStatusRow(health: TkcSourceHealthStatus) {
  const crawlKey = crawlKeyForTkcHealth(health)
  const at = new Date('2026-06-01T10:00:00.000Z')
  return {
    crawlKey,
    sourceStatus: 'ready' as const,
    sourceHealthStatus: health,
    sourceHealthReason: null,
    sourceHealthJson: null as null,
    operatorAttention: false,
    operatorAttentionReason: null as null,
    lastCrawlStatus: 'success' as const,
    lastCrawlStartedAt: at,
    lastCrawlFinishedAt: at,
    nextAllowedCrawlAt: null as null,
    lastSuccessfulCrawlAt: at,
    lastCrawlError: null as null,
    crawlCandidateCount: 1,
    crawlSkippedCount: 0,
    crawlProcessedCount: 1,
    crawlUnchangedCount: 0,
    crawlFetchErrorCount: 0,
    crawlLlmFailedCount: 0,
    consecutiveErrorCount: 0,
    detectedPolicy: null as null,
    effectivePolicy: null as null,
    createdAt: at,
    updatedAt: at,
  }
}

export function contractSourceStatusRowsInTkcOrder() {
  return TKC_SOURCE_HEALTH_STATUSES.map((h) => contractSourceStatusRow(h))
}

/** For POST /api/crawler/source-status happy-path smoke per health (subset matches TKC doc). */
export function contractCrawlerPostBody(health: TkcSourceHealthStatus) {
  return {
    crawlKey: crawlKeyForTkcHealth(health),
    sourceStatus: 'ready',
    sourceHealthStatus: health,
    sourceHealthReason: `fixture_${health}`,
    lastCrawlStatus: 'success',
  }
}

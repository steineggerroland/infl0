/**
 * Latest snapshot from GET /api/source-statuses → items[].latest (ISO dates in JSON).
 */
export type FeedSourceHealthLatest = {
    sourceStatus: string | null
    sourceHealthStatus: string | null
    sourceHealthReason: string | null
    operatorAttention: boolean
    operatorAttentionReason: string | null
    lastCrawlStatus: string | null
    lastCrawlStartedAt: string | null
    lastCrawlFinishedAt: string | null
    nextAllowedCrawlAt: string | null
    lastSuccessfulCrawlAt: string | null
    lastCrawlError: string | null
    crawlCandidateCount: number | null
    crawlSkippedCount: number | null
    crawlProcessedCount: number | null
    crawlUnchangedCount: number | null
    crawlFetchErrorCount: number | null
    crawlLlmFailedCount: number | null
    consecutiveErrorCount: number | null
    updatedAt: string
}

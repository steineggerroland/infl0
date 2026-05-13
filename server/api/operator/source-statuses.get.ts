import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireOperatorUser } from '../../utils/operator-access'
import { normalizeSourceHealthKey } from '../../../utils/source-health-display'

type FilterKey = 'all' | 'attention' | 'failing_degraded' | 'needs_setup' | 'blocked' | 'quiet'

type HintFields = {
  httpStatus: number | null
  retryAfter: string | null
  cacheControl: string | null
}

const SORT_RANK: Record<string, number> = {
  blocked: 0,
  failing: 1,
  degraded: 2,
  needs_setup: 3,
  quiet: 4,
  pending: 5,
  paused: 6,
  healthy: 7,
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function asNumberOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function asStringOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null
}

function healthSortRank(health: string | null | undefined): number {
  const k = normalizeSourceHealthKey(health)
  if (!k) return 99
  return SORT_RANK[k] ?? 99
}

function readHints(sourceHealthJson: unknown, detectedPolicy: unknown, effectivePolicy: unknown): HintFields {
  const health = asRecord(sourceHealthJson)
  const detected = asRecord(detectedPolicy)
  const effective = asRecord(effectivePolicy)
  const status =
    asNumberOrNull(health.httpStatus) ??
    asNumberOrNull(health.statusCode) ??
    asNumberOrNull(detected.httpStatus) ??
    asNumberOrNull(detected.statusCode) ??
    asNumberOrNull(effective.httpStatus) ??
    asNumberOrNull(effective.statusCode)
  const retryAfter =
    asStringOrNull(health.retryAfter) ??
    asStringOrNull(detected.retryAfter) ??
    asStringOrNull(effective.retryAfter)
  const cacheControl =
    asStringOrNull(health.cacheControl) ??
    asStringOrNull(detected.cacheControl) ??
    asStringOrNull(effective.cacheControl)
  return { httpStatus: status, retryAfter, cacheControl }
}

function includeByFilter(filter: FilterKey, item: { operatorAttention: boolean; sourceHealthStatus: string | null }) {
  const health = normalizeSourceHealthKey(item.sourceHealthStatus)
  switch (filter) {
    case 'attention':
      return item.operatorAttention
    case 'failing_degraded':
      return health === 'failing' || health === 'degraded'
    case 'needs_setup':
      return health === 'needs_setup'
    case 'blocked':
      return health === 'blocked'
    case 'quiet':
      return health === 'quiet'
    case 'all':
    default:
      return true
  }
}

/**
 * GET /api/operator/source-statuses
 *
 * Operator-only snapshot over all known source statuses.
 */
export default defineEventHandler(async (event) => {
  await requireOperatorUser(event)
  const filterRaw = String(getQuery(event).filter ?? 'all')
  const filter = (
    ['all', 'attention', 'failing_degraded', 'needs_setup', 'blocked', 'quiet'].includes(filterRaw)
      ? filterRaw
      : 'all'
  ) as FilterKey

  const [statuses, feeds] = await Promise.all([
    prisma.sourceStatus.findMany(),
    prisma.userFeed.findMany({
      select: { crawlKey: true, displayTitle: true, feedUrl: true, active: true },
    }),
  ])

  const feedMeta = new Map<
    string,
    { displayTitle: string | null; feedUrl: string | null; subscriberCount: number }
  >()
  for (const row of feeds) {
    const prev = feedMeta.get(row.crawlKey) ?? {
      displayTitle: null,
      feedUrl: null,
      subscriberCount: 0,
    }
    feedMeta.set(row.crawlKey, {
      displayTitle: prev.displayTitle ?? row.displayTitle ?? null,
      feedUrl: prev.feedUrl ?? row.feedUrl ?? null,
      subscriberCount: prev.subscriberCount + 1,
    })
  }

  const rows = statuses.map((s) => {
    const meta = feedMeta.get(s.crawlKey)
    const hints = readHints(s.sourceHealthJson, s.detectedPolicy, s.effectivePolicy)
    return {
      crawlKey: s.crawlKey,
      sourceName: meta?.displayTitle || meta?.feedUrl || s.crawlKey,
      sourceType: s.sourceStatus,
      sourceHealthStatus: s.sourceHealthStatus,
      sourceHealthReason: s.sourceHealthReason,
      operatorAttention: s.operatorAttention,
      operatorAttentionReason: s.operatorAttentionReason,
      lastCrawlStatus: s.lastCrawlStatus,
      consecutiveErrorCount: s.consecutiveErrorCount ?? 0,
      crawlCandidateCount: s.crawlCandidateCount ?? 0,
      crawlProcessedCount: s.crawlProcessedCount ?? 0,
      crawlSkippedCount: s.crawlSkippedCount ?? 0,
      crawlFetchErrorCount: s.crawlFetchErrorCount ?? 0,
      crawlLlmFailedCount: s.crawlLlmFailedCount ?? 0,
      nextAllowedCrawlAt: s.nextAllowedCrawlAt?.toISOString() ?? null,
      lastCrawlFinishedAt: s.lastCrawlFinishedAt?.toISOString() ?? null,
      subscriberCount: meta?.subscriberCount ?? 0,
      hints,
    }
  })

  rows.sort((a, b) => {
    const attentionDelta = Number(b.operatorAttention) - Number(a.operatorAttention)
    if (attentionDelta !== 0) return attentionDelta
    const healthDelta = healthSortRank(a.sourceHealthStatus) - healthSortRank(b.sourceHealthStatus)
    if (healthDelta !== 0) return healthDelta
    return a.crawlKey.localeCompare(b.crawlKey)
  })

  const filtered = rows.filter((r) => includeByFilter(filter, r))

  const summary = {
    totalSources: rows.length,
    needingAttention: rows.filter((r) => r.operatorAttention).length,
    failing: rows.filter((r) => normalizeSourceHealthKey(r.sourceHealthStatus) === 'failing').length,
    degraded: rows.filter((r) => normalizeSourceHealthKey(r.sourceHealthStatus) === 'degraded').length,
    totalRecentCandidates: rows.reduce((s, r) => s + r.crawlCandidateCount, 0),
    totalRecentProcessed: rows.reduce((s, r) => s + r.crawlProcessedCount, 0),
    totalRecentFetchErrors: rows.reduce((s, r) => s + r.crawlFetchErrorCount, 0),
    totalRecentLlmFailures: rows.reduce((s, r) => s + r.crawlLlmFailedCount, 0),
  }

  return { filter, summary, items: filtered }
})


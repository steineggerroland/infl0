import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/operator/source-statuses.get'
import { getAuthUserForEvent } from '../../server/utils/auth-user-from-event'
import { prisma } from '../../server/utils/prisma'
import { getQuery } from 'h3'

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return {
    ...actual,
    getQuery: vi.fn(),
  }
})

vi.mock('../../server/utils/auth-user-from-event', () => ({
  getAuthUserForEvent: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    sourceStatus: { findMany: vi.fn() },
    userFeed: { findMany: vi.fn() },
  },
}))

function ev() {
  return {} as never
}

describe('GET /api/operator/source-statuses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NUXT_OPERATOR_USERNAMES = 'ops'
    vi.mocked(getQuery).mockReturnValue({})
  })

  it('returns 401 without session user', async () => {
    vi.mocked(getAuthUserForEvent).mockResolvedValue(null)
    await expect(handler(ev())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns 403 when username is not allowlisted', async () => {
    vi.mocked(getAuthUserForEvent).mockResolvedValue({
      id: 'u1',
      username: 'reader',
      email: null,
      recoveryEmailVerifiedAt: null,
      name: null,
    })
    await expect(handler(ev())).rejects.toMatchObject({ statusCode: 403 })
  })

  it('allows operator and sorts attention first, then blocked/failing/degraded', async () => {
    vi.mocked(getAuthUserForEvent).mockResolvedValue({
      id: 'u-op',
      username: 'ops',
      email: null,
      recoveryEmailVerifiedAt: null,
      name: null,
    })
    const at = new Date('2026-06-01T10:00:00.000Z')
    vi.mocked(prisma.sourceStatus.findMany).mockResolvedValue([
      {
        crawlKey: 'https://healthy.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'healthy',
        sourceHealthReason: null,
        sourceHealthJson: null,
        operatorAttention: false,
        operatorAttentionReason: null,
        lastCrawlStatus: 'success',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: null,
        crawlCandidateCount: 10,
        crawlSkippedCount: 1,
        crawlProcessedCount: 9,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 0,
        crawlLlmFailedCount: 0,
        consecutiveErrorCount: 0,
        detectedPolicy: null,
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
      {
        crawlKey: 'https://blocked.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'blocked',
        sourceHealthReason: '403',
        sourceHealthJson: { statusCode: 403, retryAfter: '600' },
        operatorAttention: true,
        operatorAttentionReason: 'publisher blocked crawler',
        lastCrawlStatus: 'failed',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: 'blocked',
        crawlCandidateCount: 3,
        crawlSkippedCount: 0,
        crawlProcessedCount: 0,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 3,
        crawlLlmFailedCount: 1,
        consecutiveErrorCount: 5,
        detectedPolicy: { cacheControl: 'no-store' },
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
      {
        crawlKey: 'https://failing.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'failing',
        sourceHealthReason: 'timeout',
        sourceHealthJson: null,
        operatorAttention: true,
        operatorAttentionReason: 'timeouts',
        lastCrawlStatus: 'failed',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: 'timeout',
        crawlCandidateCount: 5,
        crawlSkippedCount: 0,
        crawlProcessedCount: 1,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 4,
        crawlLlmFailedCount: 0,
        consecutiveErrorCount: 2,
        detectedPolicy: null,
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
      {
        crawlKey: 'https://degraded.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'degraded',
        sourceHealthReason: 'partial errors',
        sourceHealthJson: null,
        operatorAttention: false,
        operatorAttentionReason: null,
        lastCrawlStatus: 'partial',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: null,
        crawlCandidateCount: 8,
        crawlSkippedCount: 2,
        crawlProcessedCount: 6,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 2,
        crawlLlmFailedCount: 1,
        consecutiveErrorCount: 1,
        detectedPolicy: null,
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
    ] as never)
    vi.mocked(prisma.userFeed.findMany).mockResolvedValue([
      { crawlKey: 'https://blocked.example/feed.xml', displayTitle: 'Blocked Feed', feedUrl: 'https://blocked.example/feed.xml', active: true },
      { crawlKey: 'https://blocked.example/feed.xml', displayTitle: null, feedUrl: 'https://blocked.example/feed.xml', active: false },
    ] as never)

    const res = await handler(ev())
    expect(res.items.map((i) => i.crawlKey)).toEqual([
      'https://blocked.example/feed.xml',
      'https://failing.example/feed.xml',
      'https://degraded.example/feed.xml',
      'https://healthy.example/feed.xml',
    ])
    expect(res.items[0]?.subscriberCount).toBe(2)
    expect(res.items[0]?.hints).toEqual({
      httpStatus: 403,
      retryAfter: '600',
      cacheControl: 'no-store',
    })
    expect(res.summary).toMatchObject({
      totalSources: 4,
      needingAttention: 2,
      failing: 1,
      degraded: 1,
      totalRecentCandidates: 26,
      totalRecentProcessed: 16,
      totalRecentFetchErrors: 9,
      totalRecentLlmFailures: 2,
    })
  })

  it('applies blocked filter', async () => {
    vi.mocked(getAuthUserForEvent).mockResolvedValue({
      id: 'u-op',
      username: 'ops',
      email: null,
      recoveryEmailVerifiedAt: null,
      name: null,
    })
    vi.mocked(getQuery).mockReturnValue({ filter: 'blocked' })
    const at = new Date('2026-06-01T10:00:00.000Z')
    vi.mocked(prisma.sourceStatus.findMany).mockResolvedValue([
      {
        crawlKey: 'https://blocked.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'blocked',
        sourceHealthReason: null,
        sourceHealthJson: null,
        operatorAttention: true,
        operatorAttentionReason: null,
        lastCrawlStatus: 'failed',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: null,
        crawlCandidateCount: 1,
        crawlSkippedCount: 0,
        crawlProcessedCount: 0,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 1,
        crawlLlmFailedCount: 0,
        consecutiveErrorCount: 1,
        detectedPolicy: null,
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
      {
        crawlKey: 'https://healthy.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'healthy',
        sourceHealthReason: null,
        sourceHealthJson: null,
        operatorAttention: false,
        operatorAttentionReason: null,
        lastCrawlStatus: 'success',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: null,
        crawlCandidateCount: 1,
        crawlSkippedCount: 0,
        crawlProcessedCount: 1,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 0,
        crawlLlmFailedCount: 0,
        consecutiveErrorCount: 0,
        detectedPolicy: null,
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
    ] as never)
    vi.mocked(prisma.userFeed.findMany).mockResolvedValue([] as never)
    const res = await handler(ev())
    expect(res.filter).toBe('blocked')
    expect(res.items).toHaveLength(1)
    expect(res.items[0]?.sourceHealthStatus).toBe('blocked')
  })

  it.each([
    ['attention', 'failing'],
    ['failing_degraded', 'degraded'],
    ['needs_setup', 'needs_setup'],
    ['quiet', 'quiet'],
  ] as const)('applies %s filter', async (filter, expectedHealth) => {
    vi.mocked(getAuthUserForEvent).mockResolvedValue({
      id: 'u-op',
      username: 'ops',
      email: null,
      recoveryEmailVerifiedAt: null,
      name: null,
    })
    vi.mocked(getQuery).mockReturnValue({ filter })
    const at = new Date('2026-06-01T10:00:00.000Z')
    vi.mocked(prisma.sourceStatus.findMany).mockResolvedValue([
      {
        crawlKey: 'https://attention.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'failing',
        sourceHealthReason: null,
        sourceHealthJson: null,
        operatorAttention: true,
        operatorAttentionReason: null,
        lastCrawlStatus: 'failed',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: null,
        crawlCandidateCount: 1,
        crawlSkippedCount: 0,
        crawlProcessedCount: 0,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 1,
        crawlLlmFailedCount: 0,
        consecutiveErrorCount: 1,
        detectedPolicy: null,
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
      {
        crawlKey: 'https://degraded.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'degraded',
        sourceHealthReason: null,
        sourceHealthJson: null,
        operatorAttention: false,
        operatorAttentionReason: null,
        lastCrawlStatus: 'partial',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: null,
        crawlCandidateCount: 1,
        crawlSkippedCount: 0,
        crawlProcessedCount: 1,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 0,
        crawlLlmFailedCount: 0,
        consecutiveErrorCount: 0,
        detectedPolicy: null,
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
      {
        crawlKey: 'https://setup.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'needs_setup',
        sourceHealthReason: null,
        sourceHealthJson: null,
        operatorAttention: false,
        operatorAttentionReason: null,
        lastCrawlStatus: 'pending',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: null,
        crawlCandidateCount: 1,
        crawlSkippedCount: 0,
        crawlProcessedCount: 0,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 0,
        crawlLlmFailedCount: 0,
        consecutiveErrorCount: 0,
        detectedPolicy: null,
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
      {
        crawlKey: 'https://quiet.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'quiet',
        sourceHealthReason: null,
        sourceHealthJson: null,
        operatorAttention: false,
        operatorAttentionReason: null,
        lastCrawlStatus: 'success',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: null,
        crawlCandidateCount: 1,
        crawlSkippedCount: 0,
        crawlProcessedCount: 1,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 0,
        crawlLlmFailedCount: 0,
        consecutiveErrorCount: 0,
        detectedPolicy: null,
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
      {
        crawlKey: 'https://healthy.example/feed.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'healthy',
        sourceHealthReason: null,
        sourceHealthJson: null,
        operatorAttention: false,
        operatorAttentionReason: null,
        lastCrawlStatus: 'success',
        lastCrawlStartedAt: at,
        lastCrawlFinishedAt: at,
        nextAllowedCrawlAt: at,
        lastSuccessfulCrawlAt: at,
        lastCrawlError: null,
        crawlCandidateCount: 1,
        crawlSkippedCount: 0,
        crawlProcessedCount: 1,
        crawlUnchangedCount: 0,
        crawlFetchErrorCount: 0,
        crawlLlmFailedCount: 0,
        consecutiveErrorCount: 0,
        detectedPolicy: null,
        effectivePolicy: null,
        createdAt: at,
        updatedAt: at,
      },
    ] as never)
    vi.mocked(prisma.userFeed.findMany).mockResolvedValue([] as never)
    const res = await handler(ev())
    expect(res.filter).toBe(filter)
    expect(res.items.length).toBeGreaterThan(0)
    for (const item of res.items) {
      if (filter === 'attention') {
        expect(item.operatorAttention).toBe(true)
      } else if (filter === 'failing_degraded') {
        expect(['failing', 'degraded']).toContain(item.sourceHealthStatus)
      } else {
        expect(item.sourceHealthStatus).toBe(expectedHealth)
      }
    }
  })
})


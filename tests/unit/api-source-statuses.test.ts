import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/source-statuses.get'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'
import {
  contractUserFeedsInTkcOrder,
  contractSourceStatusRowsInTkcOrder,
  crawlKeyForTkcHealth,
} from '../fixtures/source-status-contract'
import { TKC_SOURCE_HEALTH_STATUSES } from '../../utils/source-health-display'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    userFeed: {
      findMany: vi.fn(),
    },
    sourceStatus: {
      findMany: vi.fn(),
    },
  },
}))

function mockEvent() {
  return {} as never
}

describe('GET /api/source-statuses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without session', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null)

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 401 })
    expect(prisma.userFeed.findMany).not.toHaveBeenCalled()
  })

  it('returns only active feeds for the user with joined latest status', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('user-1')
    vi.mocked(prisma.userFeed.findMany).mockResolvedValue([
      {
        id: 'feed-a',
        feedUrl: 'https://a.com/x.xml',
        crawlKey: 'https://a.com/x.xml',
        displayTitle: 'A',
      },
    ] as never)
    const started = new Date('2026-05-10T08:00:00.000Z')
    vi.mocked(prisma.sourceStatus.findMany).mockResolvedValue([
      {
        crawlKey: 'https://a.com/x.xml',
        sourceStatus: 'ready',
        sourceHealthStatus: 'healthy',
        sourceHealthReason: null,
        sourceHealthJson: null,
        operatorAttention: false,
        operatorAttentionReason: null,
        lastCrawlStatus: 'ok',
        lastCrawlStartedAt: started,
        lastCrawlFinishedAt: null,
        nextAllowedCrawlAt: null,
        lastSuccessfulCrawlAt: null,
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
        createdAt: started,
        updatedAt: started,
      },
    ] as never)

    const res = await handler(mockEvent())
    expect(res.items).toHaveLength(1)
    const row = res.items[0]
    expect(row).toBeDefined()
    expect(row!.feed.id).toBe('feed-a')
    expect(row!.latest?.crawlKey).toBe('https://a.com/x.xml')
    expect(row!.latest?.lastCrawlStartedAt).toBe('2026-05-10T08:00:00.000Z')
    expect(prisma.sourceStatus.findMany).toHaveBeenCalledWith({
      where: { crawlKey: { in: ['https://a.com/x.xml'] } },
    })
  })

  it('scopes status keys to the user feeds only', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('user-1')
    vi.mocked(prisma.userFeed.findMany).mockResolvedValue([
      {
        id: 'f1',
        feedUrl: 'https://only-user.com/1.xml',
        crawlKey: 'https://only-user.com/1.xml',
        displayTitle: null,
      },
    ] as never)
    vi.mocked(prisma.sourceStatus.findMany).mockResolvedValue([])

    const res = await handler(mockEvent())
    expect(res.items[0]?.latest).toBeNull()
    expect(prisma.sourceStatus.findMany).toHaveBeenCalledWith({
      where: { crawlKey: { in: ['https://only-user.com/1.xml'] } },
    })
  })

  it('joins each active feed with latest status for every TKC health variant (fixture feeds)', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('user-fixtures')
    const feeds = contractUserFeedsInTkcOrder()
    const statuses = contractSourceStatusRowsInTkcOrder()
    vi.mocked(prisma.userFeed.findMany).mockResolvedValue(feeds as never)
    vi.mocked(prisma.sourceStatus.findMany).mockResolvedValue(statuses as never)

    const res = await handler(mockEvent())

    expect(res.items).toHaveLength(TKC_SOURCE_HEALTH_STATUSES.length)

    for (const health of TKC_SOURCE_HEALTH_STATUSES) {
      const key = crawlKeyForTkcHealth(health)
      const row = res.items.find((i) => i.feed.crawlKey === key)
      expect(row, `missing row for ${health}`).toBeDefined()
      expect(row!.latest?.sourceHealthStatus).toBe(health)
      expect(row!.latest?.crawlKey).toBe(key)
    }

    expect(prisma.sourceStatus.findMany).toHaveBeenCalledWith({
      where: {
        crawlKey: {
          in: TKC_SOURCE_HEALTH_STATUSES.map((h) => crawlKeyForTkcHealth(h)),
        },
      },
    })
  })
})

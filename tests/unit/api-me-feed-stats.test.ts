import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/me/feed-stats.get'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    userFeed: { findMany: vi.fn() },
    userTimelineItem: { findMany: vi.fn() },
  },
}))

function event() {
  return {} as never
}

describe('GET /api/me/feed-stats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without session', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null)
    await expect(handler(event())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns empty items when the user has no feeds', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(prisma.userFeed.findMany).mockResolvedValue([] as never)

    const res = await handler(event())
    expect(res).toEqual({ items: [], totalInflow: 0 })
    expect(prisma.userTimelineItem.findMany).not.toHaveBeenCalled()
  })

  it('aggregates inflow share + read history per crawl key', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(prisma.userFeed.findMany).mockResolvedValue([
      { id: 'feed-a', crawlKey: 'https://a.com/x.xml' },
      { id: 'feed-b', crawlKey: 'https://b.com/x.xml' },
      { id: 'feed-c', crawlKey: 'https://c.com/x.xml' },
    ] as never)

    const ago = new Date('2026-04-30T10:00:00.000Z')
    const recent = new Date('2026-05-08T18:00:00.000Z')
    vi.mocked(prisma.userTimelineItem.findMany).mockResolvedValue([
      // feed-a: 4 inflow, 2 read (one earlier, one later)
      { readAt: ago, article: { crawlKey: 'https://a.com/x.xml' } },
      { readAt: recent, article: { crawlKey: 'https://a.com/x.xml' } },
      { readAt: null, article: { crawlKey: 'https://a.com/x.xml' } },
      { readAt: null, article: { crawlKey: 'https://a.com/x.xml' } },
      // feed-b: 1 inflow, never read
      { readAt: null, article: { crawlKey: 'https://b.com/x.xml' } },
      // feed-c: not in inflow yet
    ] as never)

    const res = await handler(event())
    expect(res.totalInflow).toBe(5)

    const a = res.items.find((i) => i.feedId === 'feed-a')!
    expect(a).toMatchObject({
      inflowCount: 4,
      readCount: 2,
      unreadCount: 2,
      sharePercent: 80,
      lastReadAt: recent.toISOString(),
    })

    const b = res.items.find((i) => i.feedId === 'feed-b')!
    expect(b).toMatchObject({
      inflowCount: 1,
      readCount: 0,
      unreadCount: 1,
      sharePercent: 20,
      lastReadAt: null,
    })

    const c = res.items.find((i) => i.feedId === 'feed-c')!
    expect(c).toMatchObject({
      inflowCount: 0,
      readCount: 0,
      unreadCount: 0,
      sharePercent: 0,
      lastReadAt: null,
    })
  })

  it('rounds share percent to one decimal', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(prisma.userFeed.findMany).mockResolvedValue([
      { id: 'feed-a', crawlKey: 'https://a.com/x.xml' },
      { id: 'feed-b', crawlKey: 'https://b.com/x.xml' },
      { id: 'feed-c', crawlKey: 'https://c.com/x.xml' },
    ] as never)
    vi.mocked(prisma.userTimelineItem.findMany).mockResolvedValue([
      { readAt: null, article: { crawlKey: 'https://a.com/x.xml' } },
      { readAt: null, article: { crawlKey: 'https://b.com/x.xml' } },
      { readAt: null, article: { crawlKey: 'https://c.com/x.xml' } },
    ] as never)

    const res = await handler(event())
    expect(res.totalInflow).toBe(3)
    for (const item of res.items) {
      expect(item.sharePercent).toBe(33.3)
    }
  })
})

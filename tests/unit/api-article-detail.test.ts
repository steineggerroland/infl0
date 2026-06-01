import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/articles/[articleId].get'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    article: { findUnique: vi.fn() },
    userTimelineItem: { findFirst: vi.fn() },
    knowledgeInboxItem: { findUnique: vi.fn() },
    userFeed: { findFirst: vi.fn() },
  },
}))

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return { ...actual, getRouterParam: vi.fn() }
})

const { getRouterParam } = await import('h3')

function mockEvent() {
  return {} as never
}

function article() {
  return {
    id: 'a1',
    title: 'Article One',
    link: 'https://example.com/a1',
    author: 'Ana',
    publishedAt: new Date('2026-05-01T10:00:00.000Z'),
    fetchedAt: new Date('2026-05-01T11:00:00.000Z'),
    sourceType: 'rss',
    tld: 'example.com',
    contentMd: '# Article One',
    crawlKey: 'feed-1',
    enrichment: {
      teaser: 'Short teaser',
      summaryLong: 'Long summary',
      category: ['tech'],
      tags: ['ai'],
    },
  }
}

describe('/api/articles/:articleId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(getRouterParam).mockReturnValue('a1')
  })

  it('requires a session', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null)

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 401 })
    expect(prisma.article.findUnique).not.toHaveBeenCalled()
  })

  it('does not expose an article outside the user access set', async () => {
    vi.mocked(prisma.article.findUnique).mockResolvedValue(article() as never)
    vi.mocked(prisma.userTimelineItem.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.knowledgeInboxItem.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue(null)

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns article-centered detail for an inbox article', async () => {
    vi.mocked(prisma.article.findUnique).mockResolvedValue(article() as never)
    vi.mocked(prisma.userTimelineItem.findFirst).mockResolvedValue({ readAt: new Date('2026-05-02T10:00:00.000Z') } as never)
    vi.mocked(prisma.knowledgeInboxItem.findUnique).mockResolvedValue({
      id: 'inbox-1',
      capturedAt: new Date('2026-05-03T10:00:00.000Z'),
    } as never)
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue({ displayTitle: 'Feed One' } as never)

    await expect(handler(mockEvent())).resolves.toMatchObject({
      id: 'a1',
      title: 'Article One',
      sourceTitle: 'Feed One',
      teaser: 'Short teaser',
      summaryLong: 'Long summary',
      rawMarkdown: '# Article One',
      readAt: '2026-05-02T10:00:00.000Z',
      saved: { id: 'inbox-1', capturedAt: '2026-05-03T10:00:00.000Z' },
    })
  })
})

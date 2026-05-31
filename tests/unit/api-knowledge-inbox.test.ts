import { beforeEach, describe, expect, it, vi } from 'vitest'
import postHandler from '../../server/api/knowledge/inbox.post'
import getHandler from '../../server/api/knowledge/inbox.get'
import deleteHandler from '../../server/api/knowledge/inbox/[id].delete'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    article: { findUnique: vi.fn() },
    episode: { findUnique: vi.fn() },
    userTimelineItem: { findFirst: vi.fn() },
    userFeed: { findFirst: vi.fn() },
    knowledgeInboxItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return { ...actual, getQuery: vi.fn(), getRouterParam: vi.fn(), readBody: vi.fn() }
})

const { getQuery, getRouterParam, readBody } = await import('h3')

function mockEvent() {
  return {} as never
}

function article() {
  return {
    id: 'a1',
    title: 'Article One',
    crawlKey: 'feed-1',
    sourceType: 'rss',
    enrichment: { teaser: 'A useful teaser' },
  }
}

describe('/api/knowledge/inbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(getQuery).mockReturnValue({})
    vi.mocked(getRouterParam).mockReturnValue('11111111-1111-4111-8111-111111111111')
  })

  it('rejects saving an article the user cannot access', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({ articleId: 'a1' })
    vi.mocked(prisma.knowledgeInboxItem.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.article.findUnique).mockResolvedValue(article() as never)
    vi.mocked(prisma.userTimelineItem.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue(null)

    await expect(postHandler(mockEvent())).rejects.toMatchObject({ statusCode: 404 })
    expect(prisma.knowledgeInboxItem.create).not.toHaveBeenCalled()
  })

  it('saves an accessible article with a snapshot', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({ articleId: 'a1' })
    vi.mocked(prisma.knowledgeInboxItem.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.article.findUnique).mockResolvedValue(article() as never)
    vi.mocked(prisma.userTimelineItem.findFirst).mockResolvedValue({ readAt: null } as never)
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue({ displayTitle: 'Feed One' } as never)
    vi.mocked(prisma.knowledgeInboxItem.create).mockResolvedValue({ id: 'inbox-1' } as never)

    await expect(postHandler(mockEvent())).resolves.toEqual({ id: 'inbox-1' })
    expect(prisma.knowledgeInboxItem.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        contentKind: 'article',
        articleId: 'a1',
        titleSnapshot: 'Article One',
        sourceSnapshot: 'Feed One',
        teaserSnapshot: 'A useful teaser',
      },
    })
  })

  it('returns an existing item without creating a duplicate', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({ articleId: 'a1' })
    vi.mocked(prisma.knowledgeInboxItem.findUnique).mockResolvedValue({ id: 'existing' } as never)

    await expect(postHandler(mockEvent())).resolves.toEqual({ id: 'existing' })
    expect(prisma.article.findUnique).not.toHaveBeenCalled()
    expect(prisma.knowledgeInboxItem.create).not.toHaveBeenCalled()
  })

  it('rejects saving an inaccessible episode', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({ episodeId: 'e1' })
    vi.mocked(prisma.episode.findUnique)
      .mockResolvedValueOnce({ id: 'e1', title: 'Episode One', crawlKey: 'feed-1', sourceType: 'podcast', enrichment: null } as never)
      .mockResolvedValueOnce({ crawlKey: 'feed-1' } as never)
    vi.mocked(prisma.userTimelineItem.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.knowledgeInboxItem.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue(null)

    await expect(postHandler(mockEvent())).rejects.toMatchObject({ statusCode: 404 })
    expect(prisma.knowledgeInboxItem.create).not.toHaveBeenCalled()
  })

  it('lists items with parsed pagination', async () => {
    vi.mocked(getQuery).mockReturnValue({ limit: '500', offset: '2' })
    vi.mocked(prisma.knowledgeInboxItem.findMany).mockResolvedValue([{ id: 'i1' }] as never)
    vi.mocked(prisma.knowledgeInboxItem.count).mockResolvedValue(5)

    await expect(getHandler(mockEvent())).resolves.toEqual({
      items: [{ id: 'i1' }],
      total: 5,
      hasMore: true,
    })
    expect(prisma.knowledgeInboxItem.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: [{ capturedAt: 'desc' }, { id: 'asc' }],
      take: 100,
      skip: 2,
    })
  })

  it('prevents deleting another user inbox item', async () => {
    vi.mocked(prisma.knowledgeInboxItem.findUnique).mockResolvedValue({ userId: 'u2' } as never)

    await expect(deleteHandler(mockEvent())).rejects.toMatchObject({ statusCode: 403 })
    expect(prisma.knowledgeInboxItem.delete).not.toHaveBeenCalled()
  })

  it('deletes an owned inbox item', async () => {
    vi.mocked(prisma.knowledgeInboxItem.findUnique).mockResolvedValue({ userId: 'u1' } as never)
    vi.mocked(prisma.knowledgeInboxItem.delete).mockResolvedValue({ id: '11111111-1111-4111-8111-111111111111' } as never)

    await expect(deleteHandler(mockEvent())).resolves.toEqual({ ok: true })
    expect(prisma.knowledgeInboxItem.delete).toHaveBeenCalledWith({
      where: { id: '11111111-1111-4111-8111-111111111111' },
    })
  })
})

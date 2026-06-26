import { beforeEach, describe, expect, it, vi } from 'vitest'
import deleteHandler from '../../server/api/knowledge/reading-notes/[readingNoteId].delete'
import getHandler from '../../server/api/knowledge/reading-notes.get'
import postHandler from '../../server/api/knowledge/reading-notes.post'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'

vi.mock('../../server/utils/auth-session', () => ({ getSessionUserId: vi.fn() }))
vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    article: { findUnique: vi.fn() },
    episode: { findUnique: vi.fn() },
    userTimelineItem: { findFirst: vi.fn() },
    userFeed: { findFirst: vi.fn() },
    knowledgeInboxItem: { findUnique: vi.fn() },
    readingNote: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))
vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return {
    ...actual,
    getQuery: vi.fn(),
    getRouterParam: vi.fn(),
    readBody: vi.fn(),
    setResponseStatus: vi.fn(),
  }
})

const { getQuery, getRouterParam, readBody, setResponseStatus } = await import('h3')
const validUuid = '11111111-1111-4111-8111-111111111111'
const mockEvent = () => ({} as never)
const article = () => ({
  id: 'a1',
  title: 'Article',
  link: 'https://example.com/article',
  publishedAt: new Date(),
  fetchedAt: new Date(),
  sourceType: 'rss',
  tld: 'example.com',
  category: [],
  tags: [],
  crawlKey: 'feed-1',
  enrichment: null,
})
const episode = () => ({
  id: 'e1',
  title: 'Episode',
  link: 'https://example.com/episode',
  publishedAt: new Date(),
  fetchedAt: new Date(),
  sourceType: 'podcast',
  tld: 'example.com',
  category: [],
  tags: [],
  crawlKey: 'feed-1',
  enrichment: null,
})

describe('/api/knowledge/reading-notes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(getQuery).mockReturnValue({})
    vi.mocked(getRouterParam).mockReturnValue(validUuid)
  })

  it('requires exactly one source', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({ type: 'note', content: 'Thought' })
    await expect(postHandler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })

    vi.mocked(readBody).mockResolvedValueOnce({
      articleId: 'a1',
      episodeId: 'e1',
      type: 'note',
      content: 'Thought',
    })
    await expect(postHandler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.readingNote.create).not.toHaveBeenCalled()
  })

  it('normalizes tags and stores anchor metadata', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      articleId: 'a1',
      type: 'summary',
      content: '  My summary  ',
      context: '  Introduction ',
      tags: [' AI ', 'Research', 'ai', ''],
      anchorText: ' Selected source text ',
      anchorStartOffset: 42,
      contentSource: 'body',
    })
    vi.mocked(prisma.article.findUnique).mockResolvedValue(article() as never)
    vi.mocked(prisma.userTimelineItem.findFirst).mockResolvedValue({ readAt: null } as never)
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue({ displayTitle: 'Feed' } as never)
    vi.mocked(prisma.readingNote.create).mockResolvedValue({ id: 'r1' } as never)

    await expect(postHandler(mockEvent())).resolves.toEqual({ id: 'r1' })
    expect(prisma.readingNote.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        articleId: 'a1',
        episodeId: null,
        type: 'summary',
        content: 'My summary',
        context: 'Introduction',
        userTags: ['ai', 'research'],
        anchorText: 'Selected source text',
        anchorStartOffset: 42,
        contentSource: 'body',
      },
    })
  })

  it('creates a note for an accessible episode section', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      episodeId: 'e1',
      type: 'quote',
      content: 'A quote',
      contentSource: 'transcript',
    })
    vi.mocked(prisma.episode.findUnique).mockResolvedValue(episode() as never)
    vi.mocked(prisma.userTimelineItem.findFirst).mockResolvedValue({ readAt: null } as never)
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue({ displayTitle: 'Podcast' } as never)
    vi.mocked(prisma.readingNote.create).mockResolvedValue({ id: 'r2' } as never)

    await expect(postHandler(mockEvent())).resolves.toEqual({ id: 'r2' })
    expect(prisma.readingNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        articleId: null,
        episodeId: 'e1',
        contentSource: 'transcript',
      }),
    })
  })

  it('filters by source section and normalized tag', async () => {
    vi.mocked(getQuery).mockReturnValue({
      episodeId: 'e1',
      contentSource: 'shownotes',
      tag: ' AI ',
      limit: '20',
      offset: '5',
    })
    vi.mocked(prisma.readingNote.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.readingNote.count).mockResolvedValue(0)

    await getHandler(mockEvent())
    expect(prisma.readingNote.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        episodeId: 'e1',
        contentSource: 'shownotes',
        userTags: { has: 'ai' },
      },
      skip: 5,
      take: 20,
      orderBy: { createdAt: 'desc' },
    })
  })

  it('prevents deleting another user reading note', async () => {
    vi.mocked(prisma.readingNote.findUnique).mockResolvedValue({ userId: 'u2' } as never)
    await expect(deleteHandler(mockEvent())).rejects.toMatchObject({ statusCode: 403 })
    expect(prisma.readingNote.deleteMany).not.toHaveBeenCalled()
  })

  it('deletes an owned reading note with HTTP 204, scoped to the owner', async () => {
    vi.mocked(prisma.readingNote.findUnique).mockResolvedValue({ userId: 'u1' } as never)
    vi.mocked(prisma.readingNote.deleteMany).mockResolvedValue({ count: 1 } as never)

    await expect(deleteHandler(mockEvent())).resolves.toBeNull()
    expect(prisma.readingNote.deleteMany).toHaveBeenCalledWith({ where: { id: validUuid, userId: 'u1' } })
    expect(setResponseStatus).toHaveBeenCalledWith(expect.anything(), 204)
  })

  it('rejects content that exceeds the maximum length', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      articleId: 'a1',
      type: 'note',
      content: 'x'.repeat(10_001),
    })
    await expect(postHandler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.readingNote.create).not.toHaveBeenCalled()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/episodes/[episodeId].get'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    episode: { findUnique: vi.fn() },
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

function episode() {
  return {
    id: 'e1',
    title: 'Episode One',
    link: 'https://example.com/e1',
    author: 'Podcast One',
    publishedAt: new Date('2026-05-01T10:00:00.000Z'),
    fetchedAt: new Date('2026-05-01T11:00:00.000Z'),
    sourceType: 'rss+podcast',
    tld: 'example.com',
    contentMd: '# Episode One',
    crawlKey: 'feed-1',
    shownotesMd: '## Shownotes',
    transcriptMd: 'Transcript text',
    transcriptUrl: 'https://example.com/transcript',
    mediaUrl: 'https://cdn.example.com/e1.mp3',
    mediaType: 'audio/mpeg',
    durationSeconds: 1800,
    episodeNumber: 7,
    seasonNumber: 2,
    episodeType: 'full',
    explicit: false,
    subtitle: 'A careful episode',
    imageUrl: 'https://example.com/cover.jpg',
    chapters: [{ start_seconds: 0, title: 'Intro' }],
    enrichment: {
      teaser: 'Short teaser',
      summaryLong: 'Long summary',
      category: ['science'],
      tags: ['audio'],
    },
  }
}

describe('/api/episodes/:episodeId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(getRouterParam).mockReturnValue('e1')
  })

  it('requires a session', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null)

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 401 })
    expect(prisma.episode.findUnique).not.toHaveBeenCalled()
  })

  it('does not expose an episode outside the user access set', async () => {
    vi.mocked(prisma.episode.findUnique).mockResolvedValue(episode() as never)
    vi.mocked(prisma.userTimelineItem.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.knowledgeInboxItem.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue(null)

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns episode-centered detail for an inbox episode', async () => {
    vi.mocked(prisma.episode.findUnique).mockResolvedValue(episode() as never)
    vi.mocked(prisma.userTimelineItem.findFirst).mockResolvedValue({ readAt: new Date('2026-05-02T10:00:00.000Z') } as never)
    vi.mocked(prisma.knowledgeInboxItem.findUnique).mockResolvedValue({
      id: 'inbox-1',
      capturedAt: new Date('2026-05-03T10:00:00.000Z'),
    } as never)
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue({
      displayTitle: 'Podcast Feed',
      feedUrl: 'https://example.com/feed.xml',
    } as never)

    await expect(handler(mockEvent())).resolves.toMatchObject({
      id: 'e1',
      title: 'Episode One',
      sourceTitle: 'Podcast Feed',
      feedUrl: 'https://example.com/feed.xml',
      teaser: 'Short teaser',
      summaryLong: 'Long summary',
      rawMarkdown: '# Episode One',
      shownotesMd: '## Shownotes',
      transcriptMd: 'Transcript text',
      mediaUrl: 'https://cdn.example.com/e1.mp3',
      durationSeconds: 1800,
      chapters: [{ start_seconds: 0, title: 'Intro' }],
      readAt: '2026-05-02T10:00:00.000Z',
      saved: { id: 'inbox-1', capturedAt: '2026-05-03T10:00:00.000Z' },
    })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/me/article-engagement.post'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'
import { applicationEventBus } from '../../server/domain/events/application-events'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    userTimelineItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    articleEngagementEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../../server/domain/events/application-events', () => ({
  applicationEventBus: {
    emit: vi.fn(),
    onArticleEngagementLogged: vi.fn(),
  },
}))

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return { ...actual, readBody: vi.fn() }
})

const { readBody } = await import('h3')

function mockEvent() {
  return {} as never
}

describe('/api/me/article-engagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never)
  })

  it('ignores dwell when engagement tracking is disabled', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      engagementTrackingEnabled: false,
    } as never)

    await expect(handler(mockEvent())).resolves.toEqual({ ok: true, ignored: true })
    expect(readBody).not.toHaveBeenCalled()
    expect(prisma.userTimelineItem.update).not.toHaveBeenCalled()
  })

  it('records engagement without changing readAt', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      engagementTrackingEnabled: true,
    } as never)
    vi.mocked(readBody).mockResolvedValueOnce({
      articleId: 'a1',
      segment: 'teaser',
      durationSec: 3,
    })
    vi.mocked(prisma.userTimelineItem.findUnique).mockResolvedValue({
      id: 'row1',
      engagedSeconds: 1,
    } as never)

    await expect(handler(mockEvent())).resolves.toEqual({ ok: true })
    expect(prisma.articleEngagementEvent.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        articleId: 'a1',
        segment: 'teaser',
        durationSec: 3,
      },
    })
    expect(prisma.userTimelineItem.update).toHaveBeenCalledWith({
      where: { id: 'row1' },
      data: { engagedSeconds: 4 },
    })
    expect(applicationEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'engagement.article.logged',
        userId: 'u1',
        articleId: 'a1',
        segment: 'teaser',
        durationSec: 3,
      }),
    )
  })
})

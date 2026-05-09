import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/me/articles/[articleId]/resume-eligibility.get'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    userTimelineItem: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return { ...actual, getRouterParam: vi.fn(), getQuery: vi.fn() }
})

const { getRouterParam, getQuery } = await import('h3')

function mockEvent() {
  return {} as never
}

describe('/api/me/articles/:articleId/resume-eligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRouterParam).mockReturnValue('a1')
    vi.mocked(getQuery).mockReturnValue({})
  })

  it('returns 401 without a session', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null)

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 401 })
    expect(prisma.userTimelineItem.findUnique).not.toHaveBeenCalled()
  })

  it('returns eligible false when the article is not on the timeline', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(prisma.userTimelineItem.findUnique).mockResolvedValue(null)

    await expect(handler(mockEvent())).resolves.toEqual({ eligible: false })
  })

  it('returns eligible false when read-only filter hides a read article', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(prisma.userTimelineItem.findUnique).mockResolvedValue({
      readAt: new Date('2026-05-01'),
    } as never)
    vi.mocked(getQuery).mockReturnValue({})

    await expect(handler(mockEvent())).resolves.toEqual({ eligible: false })
  })

  it('returns eligible true when read-only filter hides but showRead is on', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(prisma.userTimelineItem.findUnique).mockResolvedValue({
      readAt: new Date('2026-05-01'),
    } as never)
    vi.mocked(getQuery).mockReturnValue({ showRead: '1' })

    await expect(handler(mockEvent())).resolves.toEqual({ eligible: true })
  })

  it('returns eligible true for an unread row when showRead is off', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(prisma.userTimelineItem.findUnique).mockResolvedValue({
      readAt: null,
    } as never)

    await expect(handler(mockEvent())).resolves.toEqual({ eligible: true })
  })
})

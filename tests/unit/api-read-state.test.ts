import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/me/articles/[articleId]/read-state.patch'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    userTimelineItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return { ...actual, getRouterParam: vi.fn(), readBody: vi.fn() }
})

const { getRouterParam, readBody } = await import('h3')

function mockEvent() {
  return {} as never
}

describe('/api/me/articles/:articleId/read-state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRouterParam).mockReturnValue('a1')
  })

  it('returns 401 without a session', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null)

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 401 })
    expect(prisma.userTimelineItem.findUnique).not.toHaveBeenCalled()
  })

  it('returns 400 when read is not boolean', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(readBody).mockResolvedValueOnce({ read: 'yes' })

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.userTimelineItem.findUnique).not.toHaveBeenCalled()
  })

  it('returns 404 when the article is not on the user timeline', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(readBody).mockResolvedValueOnce({ read: true })
    vi.mocked(prisma.userTimelineItem.findUnique).mockResolvedValue(null)

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 404 })
    expect(prisma.userTimelineItem.findUnique).toHaveBeenCalledWith({
      where: { userId_articleId: { userId: 'u1', articleId: 'a1' } },
      select: { id: true, readAt: true },
    })
  })

  it('marks a timeline article as read', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(readBody).mockResolvedValueOnce({ read: true })
    vi.mocked(prisma.userTimelineItem.findUnique).mockResolvedValue({
      id: 'row1',
      readAt: null,
    } as never)
    vi.mocked(prisma.userTimelineItem.update).mockResolvedValue({
      readAt: new Date('2026-05-02T10:00:00.000Z'),
    } as never)

    await expect(handler(mockEvent())).resolves.toEqual({
      ok: true,
      readAt: '2026-05-02T10:00:00.000Z',
    })
    const updateCall = vi.mocked(prisma.userTimelineItem.update).mock.calls[0]![0]
    expect(updateCall.where).toEqual({ id: 'row1' })
    expect(updateCall.data.readAt).toBeInstanceOf(Date)
  })

  it('marks a timeline article as unread', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(readBody).mockResolvedValueOnce({ read: false })
    vi.mocked(prisma.userTimelineItem.findUnique).mockResolvedValue({
      id: 'row1',
      readAt: new Date('2026-05-02T10:00:00.000Z'),
    } as never)
    vi.mocked(prisma.userTimelineItem.update).mockResolvedValue({ readAt: null } as never)

    await expect(handler(mockEvent())).resolves.toEqual({ ok: true, readAt: null })
    expect(prisma.userTimelineItem.update).toHaveBeenCalledWith({
      where: { id: 'row1' },
      data: { readAt: null },
      select: { readAt: true },
    })
  })
})

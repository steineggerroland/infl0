import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    userFeed: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return {
    ...actual,
    getRouterParam: vi.fn(),
    readBody: vi.fn(),
  }
})

// eslint-disable-next-line import/first
import handler from '../../server/api/feeds/[id].patch'
// eslint-disable-next-line import/first
import { getSessionUserId } from '../../server/utils/auth-session'
// eslint-disable-next-line import/first
import { prisma } from '../../server/utils/prisma'
// eslint-disable-next-line import/first
import { getRouterParam, readBody } from 'h3'

const VALID_ID = '11111111-1111-4111-8111-111111111111'

function mockEvent() {
  return {} as never
}

describe('PATCH /api/feeds/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null)
    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects malformed feed id', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('user-1')
    vi.mocked(getRouterParam).mockReturnValue('not-a-uuid')
    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects body without boolean active', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('user-1')
    vi.mocked(getRouterParam).mockReturnValue(VALID_ID)
    vi.mocked(readBody).mockResolvedValue({ active: 'yes' })
    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 404 for feeds the user does not own', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('user-1')
    vi.mocked(getRouterParam).mockReturnValue(VALID_ID)
    vi.mocked(readBody).mockResolvedValue({ active: false })
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue(null as never)

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 404 })
    expect(prisma.userFeed.update).not.toHaveBeenCalled()
  })

  it('updates active and serializes the feed on success', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('user-1')
    vi.mocked(getRouterParam).mockReturnValue(VALID_ID)
    vi.mocked(readBody).mockResolvedValue({ active: false })
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue({ id: VALID_ID } as never)

    const createdAt = new Date('2026-04-01T10:00:00.000Z')
    vi.mocked(prisma.userFeed.update).mockResolvedValue({
      id: VALID_ID,
      feedUrl: 'https://example.com/x.xml',
      crawlKey: 'https://example.com/x.xml',
      displayTitle: null,
      active: false,
      createdAt,
    } as never)

    const res = await handler(mockEvent())
    expect(prisma.userFeed.update).toHaveBeenCalledWith({
      where: { id: VALID_ID },
      data: { active: false },
      select: expect.any(Object),
    })
    expect(res.feed).toMatchObject({
      id: VALID_ID,
      active: false,
      createdAt: '2026-04-01T10:00:00.000Z',
    })
  })
})

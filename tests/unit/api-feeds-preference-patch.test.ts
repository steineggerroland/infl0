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

vi.mock('../../server/utils/recompute-timeline-scores', () => ({
  recomputeTimelineScoresForUser: vi.fn().mockResolvedValue({ updated: 0 }),
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
import handler from '../../server/api/feeds/[id]/preference.patch'
// eslint-disable-next-line import/first
import { getSessionUserId } from '../../server/utils/auth-session'
// eslint-disable-next-line import/first
import { prisma } from '../../server/utils/prisma'
// eslint-disable-next-line import/first
import { recomputeTimelineScoresForUser } from '../../server/utils/recompute-timeline-scores'
// eslint-disable-next-line import/first
import { getRouterParam, readBody } from 'h3'

const VALID_ID = '11111111-1111-4111-8111-111111111111'
function ev() { return {} as never }

describe('PATCH /api/feeds/:id/preference', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects unauthenticated requests', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null)
    await expect(handler(ev())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects malformed feed ids', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(getRouterParam).mockReturnValue('not-uuid')
    await expect(handler(ev())).rejects.toMatchObject({ statusCode: 400 })
  })

  it.each([
    ['off-grid', 0.3],
    ['out-of-range', 1.25],
    ['out-of-range negative', -2],
    ['nan-string', 'half'],
    ['null', null],
  ])('rejects %s value (%s)', async (_, value) => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(getRouterParam).mockReturnValue(VALID_ID)
    vi.mocked(readBody).mockResolvedValue({ value })
    await expect(handler(ev())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.userFeed.update).not.toHaveBeenCalled()
    expect(recomputeTimelineScoresForUser).not.toHaveBeenCalled()
  })

  it('returns 404 for foreign feeds', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(getRouterParam).mockReturnValue(VALID_ID)
    vi.mocked(readBody).mockResolvedValue({ value: 0.5 })
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue(null as never)
    await expect(handler(ev())).rejects.toMatchObject({ statusCode: 404 })
    expect(recomputeTimelineScoresForUser).not.toHaveBeenCalled()
  })

  it('persists preference and triggers a timeline rescore', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(getRouterParam).mockReturnValue(VALID_ID)
    vi.mocked(readBody).mockResolvedValue({ value: 0.75 })
    vi.mocked(prisma.userFeed.findFirst).mockResolvedValue({ id: VALID_ID } as never)
    vi.mocked(prisma.userFeed.update).mockResolvedValue({
      id: VALID_ID,
      userPreferenceWeight: 0.75,
    } as never)

    const res = await handler(ev())
    expect(prisma.userFeed.update).toHaveBeenCalledWith({
      where: { id: VALID_ID },
      data: { userPreferenceWeight: 0.75 },
      select: { id: true, userPreferenceWeight: true },
    })
    expect(recomputeTimelineScoresForUser).toHaveBeenCalledWith(prisma, 'u1')
    expect(res).toEqual({ feedId: VALID_ID, userPreferenceWeight: 0.75 })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../server/api/auth/me.get'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe('/api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no session cookie is present', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null)

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('returns 401 when the session user no longer exists', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u-missing')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
    expect(prisma.user.findUnique).toHaveBeenCalledOnce()
  })

  it('returns the signed-in user for valid sessions', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue('u1')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'u@example.com',
      name: 'U',
    })

    await expect(handler({} as never)).resolves.toEqual({
      user: {
        id: 'u1',
        email: 'u@example.com',
        name: 'U',
      },
    })
  })
})


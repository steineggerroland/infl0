import { Prisma } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import getHandler from '../../server/api/me/ui-prefs.get'
import patchHandler from '../../server/api/me/ui-prefs.patch'
import { getSessionUserId } from '../../server/utils/auth-session'
import { prisma } from '../../server/utils/prisma'
import { defaultUiPrefs } from '../../utils/ui-prefs'

vi.mock('../../server/utils/auth-session', () => ({
  getSessionUserId: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
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

describe('/api/me/ui-prefs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 without a session', async () => {
      vi.mocked(getSessionUserId).mockResolvedValue(null)
      await expect(getHandler(mockEvent())).rejects.toMatchObject({ statusCode: 401 })
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('returns 401 when the user row disappeared', async () => {
      vi.mocked(getSessionUserId).mockResolvedValue('u1')
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      await expect(getHandler(mockEvent())).rejects.toMatchObject({ statusCode: 401 })
    })

    it('returns defaults when no prefs are stored yet', async () => {
      vi.mocked(getSessionUserId).mockResolvedValue('u1')
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ uiPrefs: null } as never)
      const defaults = defaultUiPrefs()
      await expect(getHandler(mockEvent())).resolves.toMatchObject({
        v: 1,
        theme: defaults.theme,
        motion: defaults.motion,
        surfaces: defaults.surfaces,
        seenFeatureAnnouncements: [],
      })
    })

    it('returns stored prefs, dropping unknown fields', async () => {
      vi.mocked(getSessionUserId).mockResolvedValue('u1')
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        uiPrefs: {
          v: 1,
          theme: 'warm-dark',
          motion: 'reduced',
          extra: 'ignored',
          surfaces: {
            'card-front': { backgroundColor: '#112233' },
            'card-back': {},
            reader: {},
          },
          seenFeatureAnnouncements: ['reader-colors'],
        },
      } as never)
      const res = await getHandler(mockEvent())
      expect(res).toMatchObject({
        v: 1,
        theme: 'warm-dark',
        motion: 'reduced',
      })
      expect(res.surfaces['card-front'].backgroundColor).toBe('#112233')
      expect(res.seenFeatureAnnouncements).toEqual(['reader-colors'])
      expect('extra' in (res as Record<string, unknown>)).toBe(false)
    })
  })

  describe('PATCH', () => {
    it('returns 401 without a session', async () => {
      vi.mocked(getSessionUserId).mockResolvedValue(null)
      await expect(patchHandler(mockEvent())).rejects.toMatchObject({ statusCode: 401 })
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('returns 400 when the body is missing or not a JSON object', async () => {
      vi.mocked(getSessionUserId).mockResolvedValue('u1')
      vi.mocked(readBody).mockResolvedValueOnce(null)
      await expect(patchHandler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
      vi.mocked(readBody).mockResolvedValueOnce([])
      await expect(patchHandler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    })

    it('merges a partial patch into existing prefs', async () => {
      vi.mocked(getSessionUserId).mockResolvedValue('u1')
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        uiPrefs: {
          v: 1,
          theme: 'calm-light',
          motion: 'system',
          surfaces: {
            'card-front': {
              backgroundColor: null,
              textColor: null,
              fontFamily: 'system-sans',
              fontSize: 16,
              lineHeight: 'normal',
            },
            'card-back': {
              backgroundColor: null,
              textColor: null,
              fontFamily: 'system-sans',
              fontSize: 16,
              lineHeight: 'normal',
            },
            reader: {
              backgroundColor: null,
              textColor: null,
              fontFamily: 'system-serif',
              fontSize: 18,
              lineHeight: 'relaxed',
            },
          },
          seenFeatureAnnouncements: [],
        },
      } as never)
      vi.mocked(readBody).mockResolvedValueOnce({
        motion: 'reduced',
        surfaces: { 'card-front': { backgroundColor: '#123456', fontSize: 24 } },
      })
      vi.mocked(prisma.user.update).mockResolvedValue({} as never)

      const res = await patchHandler(mockEvent())
      expect(prisma.user.update).toHaveBeenCalledOnce()
      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0]
      expect(updateCall.where).toEqual({ id: 'u1' })
      expect(updateCall.data.uiPrefs).toMatchObject({
        v: 1,
        motion: 'reduced',
      })
      expect(res.motion).toBe('reduced')
      expect(res.surfaces['card-front'].backgroundColor).toBe('#123456')
      expect(res.surfaces['card-front'].fontSize).toBe(24)
      expect(res.surfaces.reader.lineHeight).toBe('relaxed')
    })

    it('ignores bad values without failing the whole request', async () => {
      vi.mocked(getSessionUserId).mockResolvedValue('u1')
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ uiPrefs: null } as never)
      vi.mocked(readBody).mockResolvedValueOnce({
        motion: 'turbo',
        surfaces: { 'card-back': { backgroundColor: 'not-a-color' } },
      })
      vi.mocked(prisma.user.update).mockResolvedValue({} as never)
      const defaults = defaultUiPrefs()

      const res = await patchHandler(mockEvent())
      expect(res.motion).toBe(defaults.motion)
      expect(res.surfaces['card-back'].backgroundColor).toBeNull()
    })

    it('resets stored prefs to null on { reset: true }', async () => {
      vi.mocked(getSessionUserId).mockResolvedValue('u1')
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ uiPrefs: {} } as never)
      vi.mocked(readBody).mockResolvedValueOnce({ reset: true })
      vi.mocked(prisma.user.update).mockResolvedValue({} as never)

      const res = await patchHandler(mockEvent())
      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0]
      expect(updateCall.data.uiPrefs).toBe(Prisma.JsonNull)
      const defaults = defaultUiPrefs()
      expect(res).toMatchObject({
        v: 1,
        theme: defaults.theme,
        motion: defaults.motion,
      })
    })
  })
})

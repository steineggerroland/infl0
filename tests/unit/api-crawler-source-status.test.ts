import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'
import handler from '../../server/api/crawler/source-status.post'
import { prisma } from '../../server/utils/prisma'
import { requireCrawlerAuth } from '../../server/utils/crawler-auth'

vi.mock('../../server/utils/crawler-auth', () => ({
  requireCrawlerAuth: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    sourceStatus: {
      upsert: vi.fn(),
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

describe('POST /api/crawler/source-status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(readBody).mockReset()
    vi.mocked(requireCrawlerAuth).mockImplementation(() => {})
    vi.mocked(prisma.sourceStatus.upsert).mockResolvedValue({} as never)
  })

  it('returns 401 when crawler auth fails', async () => {
    vi.mocked(requireCrawlerAuth).mockImplementationOnce(() => {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    })
    vi.mocked(readBody).mockResolvedValueOnce({ crawlKey: 'https://example.com/x.xml' })

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 401 })
    expect(prisma.sourceStatus.upsert).not.toHaveBeenCalled()
  })

  it('returns 400 when crawlKey is missing', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({ sourceHealthStatus: 'healthy' })

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.sourceStatus.upsert).not.toHaveBeenCalled()
  })

  it('upserts parsed payload', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      crawlKey: 'https://example.com/f.xml',
      sourceHealthStatus: 'healthy',
      operatorAttention: true,
    })

    await expect(handler(mockEvent())).resolves.toEqual({
      ok: true,
      crawlKey: 'https://example.com/f.xml',
    })

    expect(prisma.sourceStatus.upsert).toHaveBeenCalledWith({
      where: { crawlKey: 'https://example.com/f.xml' },
      create: expect.objectContaining({
        crawlKey: 'https://example.com/f.xml',
        sourceHealthStatus: 'healthy',
        operatorAttention: true,
      }),
      update: expect.objectContaining({
        sourceHealthStatus: 'healthy',
        operatorAttention: true,
      }),
    })
  })

  it('passes a minimal update object when the body has a subset of fields', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      crawlKey: 'https://example.com/subset.xml',
      lastCrawlStatus: 'ok',
    })

    await expect(handler(mockEvent())).resolves.toEqual({
      ok: true,
      crawlKey: 'https://example.com/subset.xml',
    })

    expect(prisma.sourceStatus.upsert).toHaveBeenCalledWith({
      where: { crawlKey: 'https://example.com/subset.xml' },
      create: {
        crawlKey: 'https://example.com/subset.xml',
        lastCrawlStatus: 'ok',
      },
      update: { lastCrawlStatus: 'ok' },
    })
  })
})

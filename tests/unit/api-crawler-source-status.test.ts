import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'
import { Prisma } from '~/generated/prisma/client'
import handler from '../../server/api/crawler/source-status.post'
import { prisma } from '../../server/utils/prisma'
import { requireCrawlerAuth } from '../../server/utils/crawler-auth'
import {
  contractCrawlerPostBody,
  crawlKeyForTkcHealth,
} from '../fixtures/source-status-contract'
import { TKC_SOURCE_HEALTH_STATUSES } from '../../utils/source-health-display'

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

  it('returns 400 when body is null (not an object)', async () => {
    vi.mocked(readBody).mockResolvedValueOnce(null)

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.sourceStatus.upsert).not.toHaveBeenCalled()
  })

  it('returns 400 when body is an array', async () => {
    vi.mocked(readBody).mockResolvedValueOnce([])

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.sourceStatus.upsert).not.toHaveBeenCalled()
  })

  it('returns 400 when crawlKey is not a valid URL', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({ crawlKey: 'not-a-url' })

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.sourceStatus.upsert).not.toHaveBeenCalled()
  })

  it('returns 400 when operatorAttention is not boolean', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      crawlKey: 'https://example.com/bool.xml',
      operatorAttention: 'yes',
    })

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.sourceStatus.upsert).not.toHaveBeenCalled()
  })

  it('returns 400 when crawlProcessedCount is not parseable as integer', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      crawlKey: 'https://example.com/int.xml',
      crawlProcessedCount: 'not-a-number',
    })

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.sourceStatus.upsert).not.toHaveBeenCalled()
  })

  it('returns 400 when lastCrawlFinishedAt is not a parseable date', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      crawlKey: 'https://example.com/date.xml',
      lastCrawlFinishedAt: 'not-a-date',
    })

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.sourceStatus.upsert).not.toHaveBeenCalled()
  })

  it('returns 400 when sourceHealthJson is a string', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      crawlKey: 'https://example.com/json.xml',
      sourceHealthJson: 'nope',
    })

    await expect(handler(mockEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.sourceStatus.upsert).not.toHaveBeenCalled()
  })

  it('upserts parsed payload (happy path)', async () => {
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

  it('accepts snake_case aliases (matches crawler payloads)', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      crawl_key: 'https://example.com/snake.xml',
      source_health_status: 'blocked',
      last_crawl_status: 'failed',
      crawl_candidate_count: '5',
    })

    await expect(handler(mockEvent())).resolves.toEqual({
      ok: true,
      crawlKey: 'https://example.com/snake.xml',
    })

    expect(prisma.sourceStatus.upsert).toHaveBeenCalledWith({
      where: { crawlKey: 'https://example.com/snake.xml' },
      create: expect.objectContaining({
        crawlKey: 'https://example.com/snake.xml',
        sourceHealthStatus: 'blocked',
        lastCrawlStatus: 'failed',
        crawlCandidateCount: 5,
      }),
      update: expect.objectContaining({
        sourceHealthStatus: 'blocked',
        lastCrawlStatus: 'failed',
        crawlCandidateCount: 5,
      }),
    })
  })

  it('writes explicit null for nullable JSON with Prisma.JsonNull', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      crawlKey: 'https://example.com/clear-json.xml',
      sourceHealthJson: null,
    })

    await handler(mockEvent())

    expect(prisma.sourceStatus.upsert).toHaveBeenCalledWith({
      where: { crawlKey: 'https://example.com/clear-json.xml' },
      create: expect.objectContaining({
        crawlKey: 'https://example.com/clear-json.xml',
        sourceHealthJson: Prisma.JsonNull,
      }),
      update: expect.objectContaining({
        sourceHealthJson: Prisma.JsonNull,
      }),
    })
  })

  it.each(TKC_SOURCE_HEALTH_STATUSES)(
    'accepts TKC contract sourceHealthStatus %s',
    async (health) => {
      const body = contractCrawlerPostBody(health)
      vi.mocked(readBody).mockResolvedValueOnce(body)

      await expect(handler(mockEvent())).resolves.toEqual({
        ok: true,
        crawlKey: crawlKeyForTkcHealth(health),
      })

      expect(prisma.sourceStatus.upsert).toHaveBeenCalledWith({
        where: { crawlKey: crawlKeyForTkcHealth(health) },
        create: expect.objectContaining({
          sourceHealthStatus: health,
        }),
        update: expect.objectContaining({
          sourceHealthStatus: health,
        }),
      })
    },
  )
})

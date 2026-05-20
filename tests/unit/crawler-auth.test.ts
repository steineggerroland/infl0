import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return {
    ...actual,
    getHeader: vi.fn(),
  }
})

// eslint-disable-next-line import/first
import { getHeader } from 'h3'
// eslint-disable-next-line import/first
import { requireCrawlerAuth } from '../../server/utils/crawler-auth'

const event = {} as Parameters<typeof requireCrawlerAuth>[0]

describe('requireCrawlerAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as Record<string, unknown>).useRuntimeConfig = () => ({
      crawlerApiKey: 'shared-secret',
    })
  })

  it('accepts configured extra header aliases', () => {
    vi.mocked(getHeader).mockImplementation((_, name) =>
      name === 'x-infl0-cron-key' ? 'shared-secret' : undefined,
    )

    expect(() =>
      requireCrawlerAuth(event, { extraHeaderNames: ['x-infl0-cron-key'] }),
    ).not.toThrow()
  })

  it('keeps rejecting missing or wrong keys', () => {
    vi.mocked(getHeader).mockReturnValue(undefined)

    expect(() =>
      requireCrawlerAuth(event, { extraHeaderNames: ['x-infl0-cron-key'] }),
    ).toThrow(expect.objectContaining({ statusCode: 401 }))
  })
})

import { describe, expect, it } from 'vitest'
import {
  parseSourceStatusUpsertBody,
  SourceStatusPayloadError,
} from '../../server/utils/source-status-crawler-payload'

describe('parseSourceStatusUpsertBody', () => {
  it('requires crawlKey', () => {
    expect(() => parseSourceStatusUpsertBody({})).toThrow(SourceStatusPayloadError)
    expect(() => parseSourceStatusUpsertBody({ crawlKey: '' })).toThrow(SourceStatusPayloadError)
  })

  it('normalizes crawlKey like feed URLs', () => {
    const { crawlKey, create, update } = parseSourceStatusUpsertBody({
      crawlKey: 'https://example.com/feed.xml',
      sourceHealthStatus: 'healthy',
    })
    expect(crawlKey).toBe('https://example.com/feed.xml')
    expect(create.sourceHealthStatus).toBe('healthy')
    expect(update.sourceHealthStatus).toBe('healthy')
  })

  it('accepts snake_case keys', () => {
    const { crawlKey, create, update } = parseSourceStatusUpsertBody({
      crawl_key: 'https://example.org/a.xml',
      source_health_status: 'quiet',
      crawl_candidate_count: 3,
    })
    expect(crawlKey).toBe('https://example.org/a.xml')
    expect(create.sourceHealthStatus).toBe('quiet')
    expect(update.crawlCandidateCount).toBe(3)
    expect(update).not.toHaveProperty('sourceStatus')
  })

  it('throws on invalid crawlKey URL', () => {
    expect(() => parseSourceStatusUpsertBody({ crawlKey: 'not-a-url' })).toThrow(
      SourceStatusPayloadError,
    )
  })

  it('omits absent optional fields from update (partial payload)', () => {
    const { create, update } = parseSourceStatusUpsertBody({
      crawlKey: 'https://example.com/partial.xml',
      source_health_status: 'degraded',
    })
    expect(update).toEqual({ sourceHealthStatus: 'degraded' })
    expect(update).not.toHaveProperty('lastCrawlStatus')
    expect(create).toMatchObject({
      crawlKey: 'https://example.com/partial.xml',
      sourceHealthStatus: 'degraded',
    })
    expect(create).not.toHaveProperty('lastCrawlStatus')
  })

  it('does not treat missing operatorAttention as false on update', () => {
    const { update } = parseSourceStatusUpsertBody({
      crawlKey: 'https://example.com/b.xml',
      lastCrawlStatus: 'ok',
    })
    expect(update).toEqual({ lastCrawlStatus: 'ok' })
    expect(update).not.toHaveProperty('operatorAttention')
  })

  it('sets operatorAttention when explicitly provided', () => {
    const { update } = parseSourceStatusUpsertBody({
      crawlKey: 'https://example.com/c.xml',
      operatorAttention: false,
    })
    expect(update).toEqual({ operatorAttention: false })
  })

  it('allows explicit null for nullable strings', () => {
    const { create, update } = parseSourceStatusUpsertBody({
      crawlKey: 'https://example.com/null-str.xml',
      sourceStatus: null,
    })
    expect(create.sourceStatus).toBeNull()
    expect(update.sourceStatus).toBeNull()
  })
})

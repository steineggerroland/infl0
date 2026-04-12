import { describe, expect, it } from 'vitest'
import { normalizeFeedUrl } from '../../server/utils/feed-url'

describe('normalizeFeedUrl', () => {
  it('normalizes host, strips hash and trailing slash on path', () => {
    expect(normalizeFeedUrl('HTTPS://Example.com/feed/')).toBe('https://example.com/feed')
    expect(normalizeFeedUrl('https://example.com/path#frag')).toBe('https://example.com/path')
  })

  it('throws on empty input', () => {
    expect(() => normalizeFeedUrl('  ')).toThrow()
  })

  it('throws on non-http(s) protocol', () => {
    expect(() => normalizeFeedUrl('ftp://example.com/x')).toThrow('protocol')
  })
})

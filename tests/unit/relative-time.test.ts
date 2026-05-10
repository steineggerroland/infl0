import { describe, expect, it } from 'vitest'
import { formatRelativeClock } from '../../utils/relative-time'

describe('formatRelativeClock', () => {
  it('returns label and title for a valid ISO time', () => {
    const past = new Date(Date.now() - 120_000).toISOString()
    const out = formatRelativeClock(past, 'en')
    expect(out).not.toBeNull()
    expect(out!.title.length).toBeGreaterThan(0)
    expect(out!.label.length).toBeGreaterThan(0)
  })
})

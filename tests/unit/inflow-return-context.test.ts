import { describe, expect, it } from 'vitest'
import {
  INFLOW_RETURN_CONTEXT_VERSION,
  parseInflowReturnContext,
  serializeInflowReturnContext,
} from '../../utils/inflow-return-context'

describe('inflow return context', () => {
  it('round-trips an article anchor with stable fallback positions', () => {
    const raw = serializeInflowReturnContext(
      { type: 'article', id: 'article-42' },
      5,
      3,
      '2026-05-01T12:00:00.000Z',
    )

    expect(parseInflowReturnContext(raw)).toEqual({
      v: INFLOW_RETURN_CONTEXT_VERSION,
      anchor: { type: 'article', id: 'article-42' },
      itemIndex: 5,
      articleOffset: 3,
      capturedAt: '2026-05-01T12:00:00.000Z',
    })
  })

  it('accepts onboarding anchors', () => {
    const raw = serializeInflowReturnContext(
      { type: 'onboarding', id: 'onboarding/scoring' },
      2,
      0,
      '2026-05-01T12:00:00.000Z',
    )

    expect(parseInflowReturnContext(raw)?.anchor).toEqual({
      type: 'onboarding',
      id: 'onboarding/scoring',
    })
  })

  it('rejects malformed or incompatible storage values', () => {
    expect(parseInflowReturnContext(null)).toBeNull()
    expect(parseInflowReturnContext('not json')).toBeNull()
    expect(parseInflowReturnContext(JSON.stringify({ v: 999 }))).toBeNull()
    expect(parseInflowReturnContext(JSON.stringify({
      v: INFLOW_RETURN_CONTEXT_VERSION,
      anchor: { type: 'feed', id: 'x' },
    }))).toBeNull()
    expect(parseInflowReturnContext(JSON.stringify({
      v: INFLOW_RETURN_CONTEXT_VERSION,
      anchor: { type: 'article', id: '   ' },
    }))).toBeNull()
  })

  it('normalizes fallback positions to non-negative integers', () => {
    const parsed = parseInflowReturnContext(JSON.stringify({
      v: INFLOW_RETURN_CONTEXT_VERSION,
      anchor: { type: 'article', id: 'a1' },
      itemIndex: -10,
      articleOffset: 2.9,
      capturedAt: '',
    }))

    expect(parsed?.itemIndex).toBe(0)
    expect(parsed?.articleOffset).toBe(2)
    expect(parsed?.capturedAt).toBe('1970-01-01T00:00:00.000Z')
  })
})


import { describe, expect, it } from 'vitest'
import {
  computeNormalizedFeatures,
  computeWeightedScore,
  normalizeContentLength,
  normalizeLength,
  normalizeRecencyHours,
} from '../../utils/timeline-score-normalize'
import { defaultTimelineScoreWeights, type TimelineScoreFactorId } from '../../utils/timeline-score-factors'

describe('normalizeRecencyHours', () => {
  it('returns 0 for null hours', () => {
    expect(normalizeRecencyHours(null, 72)).toBe(0)
  })

  it('is 1 at zero hours', () => {
    expect(normalizeRecencyHours(0, 72)).toBe(1)
  })

  it('halves at half-life', () => {
    expect(normalizeRecencyHours(72, 72)).toBeCloseTo(Math.exp(-1), 5)
  })
})

describe('normalizeLength', () => {
  it('caps length', () => {
    expect(normalizeLength(60, 120)).toBe(0.5)
    expect(normalizeLength(200, 120)).toBe(1)
  })
})

describe('normalizeContentLength', () => {
  it('is 0 when preference is 0', () => {
    expect(normalizeContentLength(100, 200, 500, 0)).toBe(0)
  })

  it('prefers longer: higher score for longer average', () => {
    const short = normalizeContentLength(10, 10, 10, 100)
    const long = normalizeContentLength(120, 400, 4000, 100)
    expect(long).toBeGreaterThan(short)
  })

  it('prefers shorter: higher score for shorter average', () => {
    const short = normalizeContentLength(10, 10, 10, -100)
    const long = normalizeContentLength(240, 800, 8000, -100)
    expect(short).toBeGreaterThan(long)
  })

  it('scales with |preference|', () => {
    const half = normalizeContentLength(60, 100, 500, 50)
    const full = normalizeContentLength(60, 100, 500, 100)
    expect(full).toBeGreaterThan(half)
  })
})

describe('computeNormalizedFeatures', () => {
  const now = Date.parse('2025-01-10T12:00:00.000Z')

  it('uses 0 for missing optional fields', () => {
    const f = computeNormalizedFeatures({ title: 'Hi' }, now, 0)
    expect(f.inserted_recency).toBe(0)
    expect(f.content_length).toBe(0)
    expect(f.crawl_diversity).toBe(0)
    expect(f.engagement_positive).toBe(0)
  })

  it('computes recency from ISO dates', () => {
    const f = computeNormalizedFeatures(
      {
        title: 'T',
        publishedAt: '2025-01-09T12:00:00.000Z',
        insertedAt: '2025-01-10T06:00:00.000Z',
      },
      now,
      0,
    )
    expect(f.published_recency).toBeGreaterThan(0)
    expect(f.inserted_recency).toBeGreaterThan(f.published_recency)
  })

  it('includes content_length when preference non-zero', () => {
    const f = computeNormalizedFeatures({ title: 'x'.repeat(120) }, now, 100)
    expect(f.content_length).toBeGreaterThan(0)
  })
})

describe('computeWeightedScore', () => {
  it('sums weighted features', () => {
    const features = computeNormalizedFeatures(
      { title: 'Hello', publishedAt: new Date().toISOString() },
      Date.now(),
      0,
    )
    const w = defaultTimelineScoreWeights()
    for (const id of Object.keys(w) as TimelineScoreFactorId[]) {
      w[id] = 0
    }
    w.published_recency = 100
    const s = computeWeightedScore(features, w)
    expect(s).toBeCloseTo(features.published_recency, 5)
  })
})

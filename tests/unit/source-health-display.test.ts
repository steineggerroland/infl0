import { describe, expect, it } from 'vitest'
import {
  TKC_SOURCE_HEALTH_STATUSES,
  TRIAGE_RANK,
  isAttentionStatus,
  isKnownTkcSourceHealthStatus,
  normalizeSourceHealthKey,
  sourceHealthBadgeTone,
  sourceHealthDataAttribute,
  sourceHealthStatusDotClass,
  triageRank,
} from '../../utils/source-health-display'

describe('source-health-display (TopicKnowledgeCrawler SOURCE_STATUS_API contract)', () => {
  it('exposes exactly eight canonical health keys', () => {
    expect(TKC_SOURCE_HEALTH_STATUSES).toEqual([
      'pending',
      'needs_setup',
      'healthy',
      'quiet',
      'degraded',
      'failing',
      'blocked',
      'paused',
    ])
  })

  it.each(TKC_SOURCE_HEALTH_STATUSES)('treats %s as known TKC status', (s) => {
    expect(isKnownTkcSourceHealthStatus(s)).toBe(true)
  })

  it('normalizes keys case-insensitively', () => {
    expect(normalizeSourceHealthKey('  Healthy  ')).toBe('healthy')
    expect(normalizeSourceHealthKey('')).toBeNull()
    expect(normalizeSourceHealthKey(null)).toBeNull()
  })

  it('maps TKC statuses to stable badge tones', () => {
    expect(sourceHealthBadgeTone('healthy')).toBe('success')
    expect(sourceHealthBadgeTone('quiet')).toBe('info')
    expect(sourceHealthBadgeTone('paused')).toBe('info')
    expect(sourceHealthBadgeTone('pending')).toBe('ghost')
    expect(sourceHealthBadgeTone('needs_setup')).toBe('ghost')
    expect(sourceHealthBadgeTone('degraded')).toBe('warning')
    expect(sourceHealthBadgeTone('failing')).toBe('error')
    expect(sourceHealthBadgeTone('blocked')).toBe('error')
  })

  it('maps badge tone to daisyUI Status dot classes', () => {
    expect(sourceHealthStatusDotClass('healthy')).toContain('status-success')
    expect(sourceHealthStatusDotClass('healthy')).toContain('status-md')
    expect(sourceHealthStatusDotClass('failing')).toContain('status-error')
    expect(sourceHealthStatusDotClass('pending')).toContain('status-neutral')
  })

  it('data attribute reflects snapshot + sourceHealthStatus', () => {
    expect(sourceHealthDataAttribute(null)).toBe('no_snapshot')
    expect(sourceHealthDataAttribute({ sourceHealthStatus: null })).toBe('missing')
    expect(sourceHealthDataAttribute({ sourceHealthStatus: '   ' })).toBe('missing')
    expect(
      sourceHealthDataAttribute({ sourceHealthStatus: 'healthy' }),
    ).toBe('healthy')
    expect(
      sourceHealthDataAttribute({ sourceHealthStatus: 'BLOCKED' }),
    ).toBe('blocked')
  })

  it('triage rank orders worst-first across canonical statuses', () => {
    const order = [...TKC_SOURCE_HEALTH_STATUSES].sort(
      (a, b) => TRIAGE_RANK[a]! - TRIAGE_RANK[b]!,
    )
    expect(order).toEqual([
      'failing',
      'blocked',
      'degraded',
      'needs_setup',
      'pending',
      'quiet',
      'paused',
      'healthy',
    ])
  })

  it('triage rank treats missing snapshot and unknown statuses as last', () => {
    expect(triageRank(null)).toBeGreaterThan(TRIAGE_RANK.healthy!)
    expect(triageRank({ sourceHealthStatus: 'something-weird' })).toBeGreaterThan(
      TRIAGE_RANK.healthy!,
    )
    expect(triageRank({ sourceHealthStatus: 'failing' })).toBe(TRIAGE_RANK.failing)
  })

  it('attention status flags only triage-worthy keys', () => {
    expect(isAttentionStatus({ sourceHealthStatus: 'failing' })).toBe(true)
    expect(isAttentionStatus({ sourceHealthStatus: 'blocked' })).toBe(true)
    expect(isAttentionStatus({ sourceHealthStatus: 'degraded' })).toBe(true)
    expect(isAttentionStatus({ sourceHealthStatus: 'needs_setup' })).toBe(true)
    expect(isAttentionStatus({ sourceHealthStatus: 'healthy' })).toBe(false)
    expect(isAttentionStatus({ sourceHealthStatus: 'paused' })).toBe(false)
    expect(isAttentionStatus({ sourceHealthStatus: 'quiet' })).toBe(false)
    expect(isAttentionStatus(null)).toBe(false)
  })
})

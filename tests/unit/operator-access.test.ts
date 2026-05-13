import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  parseOperatorEmails,
  operatorEmailsFromEnv,
  summarizeOperatorAccess,
} from '../../server/utils/operator-access'

describe('parseOperatorEmails', () => {
  it('returns empty allowlist for undefined / empty input', () => {
    for (const raw of [undefined, '', '   ', ',,,']) {
      const result = parseOperatorEmails(raw)
      expect(result.allowed.size).toBe(0)
      expect(result.invalid).toEqual([])
    }
  })

  it('lower-cases and trims valid emails', () => {
    const result = parseOperatorEmails(' Ops@Example.com ,  alice@example.org')
    expect([...result.allowed].sort()).toEqual([
      'alice@example.org',
      'ops@example.com',
    ])
    expect(result.invalid).toEqual([])
  })

  it('collects entries without `@…` shape as invalid instead of allow-listing them', () => {
    const result = parseOperatorEmails(
      'ops@example.com, not-an-email, ops@, @example.com, two@@signs',
    )
    expect([...result.allowed]).toEqual(['ops@example.com'])
    expect(result.invalid).toEqual([
      'not-an-email',
      'ops@',
      '@example.com',
      'two@@signs',
    ])
  })

  it('accepts single-label local hostnames like `operator@localhost`', () => {
    const result = parseOperatorEmails('operator@localhost')
    expect([...result.allowed]).toEqual(['operator@localhost'])
    expect(result.invalid).toEqual([])
  })

  it('deduplicates case- and whitespace-equivalent entries', () => {
    const result = parseOperatorEmails('ops@example.com, OPS@EXAMPLE.COM ,ops@example.com')
    expect([...result.allowed]).toEqual(['ops@example.com'])
  })
})

describe('operatorEmailsFromEnv / summarizeOperatorAccess', () => {
  beforeEach(() => {
    vi.stubEnv('NUXT_OPERATOR_EMAILS', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reports `configured: false` and zero count when the env var is empty', () => {
    const summary = summarizeOperatorAccess()
    expect(summary).toEqual({ configured: false, count: 0, invalid: [] })
    expect(operatorEmailsFromEnv().size).toBe(0)
  })

  it('reports `configured: true` with zero count when only invalid entries are present', () => {
    vi.stubEnv('NUXT_OPERATOR_EMAILS', 'not-an-email, also@@bad')
    const summary = summarizeOperatorAccess()
    expect(summary.configured).toBe(true)
    expect(summary.count).toBe(0)
    expect(summary.invalid).toEqual(['not-an-email', 'also@@bad'])
    expect(operatorEmailsFromEnv().size).toBe(0)
  })

  it('reports counts and surfaces invalid entries alongside valid ones', () => {
    vi.stubEnv('NUXT_OPERATOR_EMAILS', 'ops@example.com, broken, alice@example.org')
    const summary = summarizeOperatorAccess()
    expect(summary.configured).toBe(true)
    expect(summary.count).toBe(2)
    expect(summary.invalid).toEqual(['broken'])
    expect([...operatorEmailsFromEnv()].sort()).toEqual([
      'alice@example.org',
      'ops@example.com',
    ])
  })
})

describe('operator-access boot log', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.stubEnv('NUXT_OPERATOR_EMAILS', '')
    ;(globalThis as Record<string, unknown>).defineNitroPlugin = (fn: () => void) => fn()
  })

  afterEach(() => {
    (globalThis as Record<string, unknown>).defineNitroPlugin = undefined
    vi.unstubAllEnvs()
  })

  it('warns once when the allowlist is empty', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await import('../../server/plugins/operator-access-boot-log')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/NUXT_OPERATOR_EMAILS is empty/u)
    expect(info).not.toHaveBeenCalled()
  })

  it('warns when only invalid entries are configured', async () => {
    vi.stubEnv('NUXT_OPERATOR_EMAILS', 'oops')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await import('../../server/plugins/operator-access-boot-log')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/none look like an email/u)
  })

  it('logs an info line on healthy configuration and warns about invalid extras', async () => {
    vi.stubEnv('NUXT_OPERATOR_EMAILS', 'ops@example.com, broken')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await import('../../server/plugins/operator-access-boot-log')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/ignoring 1 invalid operator email/u)
    expect(info).toHaveBeenCalledWith('[operator-access] 1 operator email configured')
  })
})

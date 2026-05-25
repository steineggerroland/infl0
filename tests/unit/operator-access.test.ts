import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  parseOperatorUsernames,
  operatorUsernamesFromEnv,
  summarizeOperatorAccess,
} from '../../server/utils/operator-access'

describe('parseOperatorUsernames', () => {
  it('returns empty allowlist for undefined / empty input', () => {
    for (const raw of [undefined, '', '   ', ',,,']) {
      const result = parseOperatorUsernames(raw)
      expect(result.allowed.size).toBe(0)
      expect(result.invalid).toEqual([])
    }
  })

  it('lower-cases and trims valid usernames', () => {
    const result = parseOperatorUsernames(' operator ,  Dev')
    expect([...result.allowed].sort()).toEqual(['dev', 'operator'])
    expect(result.invalid).toEqual([])
  })

  it('collects invalid handles separately', () => {
    const result = parseOperatorUsernames('operator, ab, @@bad')
    expect([...result.allowed]).toEqual(['operator'])
    expect(result.invalid).toEqual(['ab', '@@bad'])
  })

  it('deduplicates case- and whitespace-equivalent entries', () => {
    const result = parseOperatorUsernames('operator, OPERATOR ,operator')
    expect([...result.allowed]).toEqual(['operator'])
  })
})

describe('operatorUsernamesFromEnv / summarizeOperatorAccess', () => {
  beforeEach(() => {
    vi.stubEnv('NUXT_OPERATOR_USERNAMES', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reports `configured: false` and zero count when the env var is empty', () => {
    const summary = summarizeOperatorAccess()
    expect(summary).toEqual({ configured: false, count: 0, invalid: [] })
    expect(operatorUsernamesFromEnv().size).toBe(0)
  })

  it('reports `configured: true` with zero count when only invalid entries are present', () => {
    vi.stubEnv('NUXT_OPERATOR_USERNAMES', 'ab, @@bad')
    const summary = summarizeOperatorAccess()
    expect(summary.configured).toBe(true)
    expect(summary.count).toBe(0)
    expect(summary.invalid).toEqual(['ab', '@@bad'])
    expect(operatorUsernamesFromEnv().size).toBe(0)
  })

  it('reports counts and surfaces invalid entries alongside valid ones', () => {
    vi.stubEnv('NUXT_OPERATOR_USERNAMES', 'operator, @@bad, dev')
    const summary = summarizeOperatorAccess()
    expect(summary.configured).toBe(true)
    expect(summary.count).toBe(2)
    expect(summary.invalid).toEqual(['@@bad'])
    expect([...operatorUsernamesFromEnv()].sort()).toEqual(['dev', 'operator'])
  })
})

describe('operator-access boot log', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.stubEnv('NUXT_OPERATOR_USERNAMES', '')
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
    expect(warn.mock.calls[0]?.[0]).toMatch(/NUXT_OPERATOR_USERNAMES is empty/u)
    expect(info).not.toHaveBeenCalled()
  })

  it('warns when only invalid entries are configured', async () => {
    vi.stubEnv('NUXT_OPERATOR_USERNAMES', 'ab')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await import('../../server/plugins/operator-access-boot-log')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/none are valid usernames/u)
  })

  it('logs an info line on healthy configuration and warns about invalid extras', async () => {
    vi.stubEnv('NUXT_OPERATOR_USERNAMES', 'operator, @@bad')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await import('../../server/plugins/operator-access-boot-log')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/ignoring 1 invalid operator username/u)
    expect(info).toHaveBeenCalledWith('[operator-access] 1 operator username configured')
  })
})

import { describe, expect, it } from 'vitest'
import { inflowReturnRoutesPreserveReaderSession } from '../../utils/inflow-return-context'

describe('inflowReturnRoutesPreserveReaderSession', () => {
  it('matches feeds, help, and settings subtree', () => {
    expect(inflowReturnRoutesPreserveReaderSession('/feeds')).toBe(true)
    expect(inflowReturnRoutesPreserveReaderSession('/help')).toBe(true)
    expect(inflowReturnRoutesPreserveReaderSession('/settings')).toBe(true)
    expect(inflowReturnRoutesPreserveReaderSession('/settings/personalization')).toBe(true)
  })

  it('does not match login or arbitrary paths', () => {
    expect(inflowReturnRoutesPreserveReaderSession('/login')).toBe(false)
    expect(inflowReturnRoutesPreserveReaderSession('/')).toBe(false)
    expect(inflowReturnRoutesPreserveReaderSession('')).toBe(false)
  })
})

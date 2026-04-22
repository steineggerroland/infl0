import { describe, expect, it } from 'vitest'
import { sanitizeNameIconInitials } from '../../utils/name-icon-initials'

describe('sanitizeNameIconInitials', () => {
  it('leaves unproblematic pairs unchanged', () => {
    expect(sanitizeNameIconInitials('AB')).toBe('AB')
    expect(sanitizeNameIconInitials('MK')).toBe('MK')
  })

  it('replaces Nazi-era abbreviation pairs with neutral two-glyph alternatives', () => {
    expect(sanitizeNameIconInitials('SS')).toBe('SZ')
    expect(sanitizeNameIconInitials('SA')).toBe('SZ')
    expect(sanitizeNameIconInitials('AH')).toBe('A0')
    expect(sanitizeNameIconInitials('HH')).toBe('H0')
    expect(sanitizeNameIconInitials('SD')).toBe('S0')
    expect(sanitizeNameIconInitials('NS')).toBe('N0')
    expect(sanitizeNameIconInitials('HJ')).toBe('H0')
    expect(sanitizeNameIconInitials('KZ')).toBe('K0')
  })

  it('normalizes casing before lookup', () => {
    expect(sanitizeNameIconInitials('ss')).toBe('SZ')
    expect(sanitizeNameIconInitials('ah')).toBe('A0')
  })

  it('passes through short or empty strings', () => {
    expect(sanitizeNameIconInitials('')).toBe('')
    expect(sanitizeNameIconInitials('X')).toBe('X')
  })
})

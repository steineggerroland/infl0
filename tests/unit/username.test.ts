import { describe, expect, it } from 'vitest'
import {
  isValidNewUsername,
  normalizeOptionalRecoveryEmail,
  normalizeUsername,
} from '../../utils/username'

describe('normalizeUsername', () => {
  it('trims and lower-cases', () => {
    expect(normalizeUsername('  Robin ')).toBe('robin')
  })
})

describe('isValidNewUsername', () => {
  it('accepts simple handles', () => {
    expect(isValidNewUsername('robin')).toBe(true)
    expect(isValidNewUsername('dev')).toBe(true)
  })

  it('rejects empty or too short handles', () => {
    expect(isValidNewUsername('')).toBe(false)
    expect(isValidNewUsername('ab')).toBe(false)
  })
})

describe('normalizeOptionalRecoveryEmail', () => {
  it('returns null for blank input', () => {
    expect(normalizeOptionalRecoveryEmail('')).toBeNull()
    expect(normalizeOptionalRecoveryEmail(undefined)).toBeNull()
  })

  it('normalizes valid recovery emails', () => {
    expect(normalizeOptionalRecoveryEmail('  Robin@Example.com ')).toBe('robin@example.com')
  })

  it('returns null for invalid shapes', () => {
    expect(normalizeOptionalRecoveryEmail('not-an-email')).toBeNull()
  })
})

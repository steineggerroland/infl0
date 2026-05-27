import { describe, expect, it } from 'vitest'
import {
  EMAIL_OTP_LENGTH,
  isCompleteEmailOtp,
  sanitizeEmailOtpInput,
} from '../../utils/email-otp-code'

describe('sanitizeEmailOtpInput', () => {
  it('keeps digits only and caps length', () => {
    expect(sanitizeEmailOtpInput('12a34b56c78')).toBe('123456')
    expect(sanitizeEmailOtpInput('1234567890')).toBe('123456')
  })

  it('allows partial input', () => {
    expect(sanitizeEmailOtpInput('123')).toBe('123')
  })
})

describe('isCompleteEmailOtp', () => {
  it('accepts exactly six digits', () => {
    expect(isCompleteEmailOtp('123456')).toBe(true)
    expect(EMAIL_OTP_LENGTH).toBe(6)
  })

  it('rejects incomplete or non-digit codes', () => {
    expect(isCompleteEmailOtp('12345')).toBe(false)
    expect(isCompleteEmailOtp('1234567')).toBe(false)
    expect(isCompleteEmailOtp('12ab56')).toBe(false)
  })
})

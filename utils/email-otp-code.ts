export const EMAIL_OTP_LENGTH = 6

export const EMAIL_OTP_PATTERN = String.raw`\d{6}`

/** Keep only digits, capped at six characters — for OTP input fields. */
export function sanitizeEmailOtpInput(raw: string): string {
  return raw.replace(/\D/gu, '').slice(0, EMAIL_OTP_LENGTH)
}

export function isCompleteEmailOtp(code: string): boolean {
  return new RegExp(`^${EMAIL_OTP_PATTERN}$`, 'u').test(code)
}

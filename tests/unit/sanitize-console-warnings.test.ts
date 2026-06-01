import { describe, expect, it } from 'vitest'
import { redactConsoleWarning } from '../setup/sanitize-console-warnings'

describe('redactConsoleWarning', () => {
  it('redacts sensitive key-value pairs from warning text', () => {
    expect(redactConsoleWarning('token=abc123 api_key: secret-value password=hunter2')).toBe(
      'token=[REDACTED] api_key=[REDACTED] password=[REDACTED]',
    )
  })

  it('redacts sensitive JSON properties from warning text', () => {
    expect(redactConsoleWarning('payload {"authorization":"Bearer abc","salt":"123"}')).toBe(
      'payload {"authorization": "[REDACTED]","salt": "[REDACTED]"}',
    )
  })

  it('redacts seeded SRP environment variable names', () => {
    expect(redactConsoleWarning('Missing DEV_SRP_VERIFIER_HEX and OPERATOR_SRP_SALT_HEX')).toBe(
      'Missing [REDACTED_ENV] and [REDACTED_ENV]',
    )
  })
})

import { createError, type H3Event } from 'h3'
import { getAuthUserForEvent } from './auth-user-from-event'

// Permissive shape check — allow-list semantics, not signup validation.
// Accepts `user@host` (single-label like `operator@localhost`) and
// `user@host.tld`; rejects entries without `@`, with whitespace, or
// with empty local/domain parts. Multiple `@` are rejected too.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+$/u

export type OperatorAllowlistParseResult = {
  allowed: ReadonlySet<string>
  invalid: ReadonlyArray<string>
}

/**
 * Parses `NUXT_OPERATOR_EMAILS` (comma-separated) into a lower-cased Set
 * of allow-listed emails. Entries that do not look like an email
 * (`local@domain.tld` shape after `trim().toLowerCase()`) are returned
 * separately in `invalid` so callers — boot logs, ops tooling — can
 * surface typos instead of silently producing an empty allowlist.
 */
export function parseOperatorEmails(raw: string | undefined): OperatorAllowlistParseResult {
  if (!raw) return { allowed: new Set(), invalid: [] }
  const allowed = new Set<string>()
  const invalid: string[] = []
  for (const part of raw.split(',')) {
    const candidate = part.trim().toLowerCase()
    if (!candidate) continue
    if (!EMAIL_SHAPE.test(candidate)) {
      invalid.push(candidate)
      continue
    }
    allowed.add(candidate)
  }
  return { allowed, invalid }
}

export function operatorEmailsFromEnv(): Set<string> {
  return new Set(parseOperatorEmails(process.env.NUXT_OPERATOR_EMAILS).allowed)
}

/**
 * Summarises the operator allowlist for boot logs / health checks.
 *
 * Reads `process.env.NUXT_OPERATOR_EMAILS` on every call so dev-server
 * env reloads stay observable.
 */
export function summarizeOperatorAccess(): {
  configured: boolean
  count: number
  invalid: ReadonlyArray<string>
} {
  const raw = process.env.NUXT_OPERATOR_EMAILS
  const result = parseOperatorEmails(raw)
  return {
    configured: typeof raw === 'string' && raw.trim().length > 0,
    count: result.allowed.size,
    invalid: result.invalid,
  }
}

/**
 * Guard for operator-only server endpoints and pages.
 *
 * Access rule: the signed-in user's email (after `trim().toLowerCase()`)
 * must appear in `NUXT_OPERATOR_EMAILS` (comma-separated). The match is
 * **string-based** against the `users.email` column — there is no
 * foreign-key relationship between the env value and the `users` table:
 *
 * - Renaming a user's email (if/when that becomes possible) revokes
 *   operator access until the env var is updated.
 * - An empty or typo-only allowlist denies every request with 403, so
 *   the only path to operator access is via deployment configuration.
 *
 * This is the chosen Phase 1 design (env over DB role); see
 * [`docs/OPERATOR.md`](../../docs/OPERATOR.md).
 */
export async function requireOperatorUser(event: H3Event): Promise<{ id: string; email: string }> {
  const user = await getAuthUserForEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const email = user.email?.trim().toLowerCase()
  const allow = operatorEmailsFromEnv()
  if (!email || allow.size === 0 || !allow.has(email)) {
    throw createError({ statusCode: 403, statusMessage: 'Operator access denied' })
  }
  return { id: user.id, email }
}

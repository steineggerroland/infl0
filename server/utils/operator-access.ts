import { createError, type H3Event } from 'h3'
import { normalizeUsername } from '~/utils/username'
import { getAuthUserForEvent } from './auth-user-from-event'

const USERNAME_SHAPE = /^[a-z0-9][a-z0-9._-]{2,63}$/u

export type OperatorAllowlistParseResult = {
  allowed: ReadonlySet<string>
  invalid: ReadonlyArray<string>
}

/**
 * Parses `NUXT_OPERATOR_USERNAMES` (comma-separated) into a lower-cased Set
 * of allow-listed usernames.
 */
export function parseOperatorUsernames(raw: string | undefined): OperatorAllowlistParseResult {
  if (!raw) return { allowed: new Set(), invalid: [] }
  const allowed = new Set<string>()
  const invalid: string[] = []
  for (const part of raw.split(',')) {
    const candidate = normalizeUsername(part)
    if (!candidate) continue
    if (!USERNAME_SHAPE.test(candidate)) {
      invalid.push(candidate)
      continue
    }
    allowed.add(candidate)
  }
  return { allowed, invalid }
}

export function operatorUsernamesFromEnv(): Set<string> {
  return new Set(parseOperatorUsernames(process.env.NUXT_OPERATOR_USERNAMES).allowed)
}

export function summarizeOperatorAccess(): {
  configured: boolean
  count: number
  invalid: ReadonlyArray<string>
} {
  const raw = process.env.NUXT_OPERATOR_USERNAMES
  const result = parseOperatorUsernames(raw)
  return {
    configured: typeof raw === 'string' && raw.trim().length > 0,
    count: result.allowed.size,
    invalid: result.invalid,
  }
}

/**
 * Guard for operator-only server endpoints and pages.
 *
 * Access rule: the signed-in user's `username` must appear in
 * `NUXT_OPERATOR_USERNAMES` (comma-separated, normalized to lowercase).
 */
export async function requireOperatorUser(event: H3Event): Promise<{ id: string; username: string }> {
  const user = await getAuthUserForEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const username = normalizeUsername(user.username)
  const allow = operatorUsernamesFromEnv()
  if (!username || allow.size === 0 || !allow.has(username)) {
    throw createError({ statusCode: 403, statusMessage: 'Operator access denied' })
  }
  return { id: user.id, username }
}

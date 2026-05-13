import { createError, type H3Event } from 'h3'
import { getAuthUserForEvent } from './auth-user-from-event'

function parseOperatorEmails(raw: string | undefined): Set<string> {
  if (!raw) return new Set()
  const out = new Set<string>()
  for (const part of raw.split(',')) {
    const email = part.trim().toLowerCase()
    if (email) out.add(email)
  }
  return out
}

export function operatorEmailsFromEnv(): Set<string> {
  return parseOperatorEmails(process.env.NUXT_OPERATOR_EMAILS)
}

/**
 * Guard for operator-only server endpoints/pages.
 *
 * Access rule: signed-in user email must be listed in `NUXT_OPERATOR_EMAILS`.
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


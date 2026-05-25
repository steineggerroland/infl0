/** Normalizes usernames for storage, lookup, and SRP identity. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase()
}

const USERNAME_RE = /^[a-z0-9][a-z0-9._@-]{2,119}$/u

/** New registrations: lowercase handle; migration may retain email-shaped values. */
export function isValidNewUsername(normalized: string): boolean {
  return USERNAME_RE.test(normalized)
}

const OPTIONAL_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u

export function normalizeOptionalRecoveryEmail(raw: string | undefined | null): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) return null
  return OPTIONAL_EMAIL_RE.test(trimmed) ? trimmed : null
}

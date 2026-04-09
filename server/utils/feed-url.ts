/**
 * Normalisiert eine Feed-URL zu einem stabilen crawlKey (muss mit dem Crawler übereinstimmen).
 */
export function normalizeFeedUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('empty')
  }
  const u = new URL(trimmed)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('protocol')
  }
  u.hash = ''
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.slice(0, -1)
  }
  return u.href
}

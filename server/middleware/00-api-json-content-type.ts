import { defineEventHandler, setResponseHeader } from 'h3'

/**
 * Baseline for `/api/**`: prefer JSON on the wire so clients (curl, fetch)
 * do not assume HTML when a handler omits `Content-Type`.
 *
 * Complements:
 * - `utils/auth-middleware.ts` (SPA never runs auth redirects for `/api/*`)
 * - `server/api/[...path].ts` (404 JSON for unknown API routes)
 * - Per-route handlers (e.g. `auth/me` → 401 via `createError`)
 */
export default defineEventHandler((event) => {
  const path = event.path ?? ''
  if (!path.startsWith('/api')) return
  setResponseHeader(event, 'content-type', 'application/json; charset=utf-8')
})

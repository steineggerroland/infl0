import { defineEventHandler, setResponseStatus } from 'h3'

/**
 * Catch-all fallback for unknown API routes.
 *
 * Why this exists:
 * - `/api/*` must behave like an API surface (JSON + HTTP status), never
 *   like a page route that can be redirected by SPA middleware.
 * - Browser visits to non-existent API paths should still get a structured
 *   payload instead of HTML/login navigation.
 *
 * Nuxt's file routing prioritizes concrete handlers over this catch-all, so
 * existing endpoints (e.g. `/api/timeline`, `/api/auth/me`) are unaffected.
 */
export default defineEventHandler((event) => {
  setResponseStatus(event, 404, 'Not Found')
  return {
    statusCode: 404,
    message: 'Not found',
    path: event.path,
  }
})


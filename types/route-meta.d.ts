/**
 * Extends Vue Router's `RouteMeta` so `definePageMeta({ auth })` is typed.
 *
 * Every page declares its auth requirement explicitly; see
 * `docs/CONTENT_AND_A11Y.md` → "Page auth mode" for the reasoning.
 */
import 'vue-router'
import type { AuthMode } from '~/utils/auth-decision'

declare module 'vue-router' {
    interface RouteMeta {
        /**
         * How the auth middleware should treat this route.
         * - `public`   — no auth lookup, always accessible (e.g. `/help`).
         * - `entry`    — login / registration; redirect signed-in users to `/`.
         * - `required` (default) — signed-in users only; redirects to `/login`.
         */
        auth?: AuthMode
    }
}

export {}

/**
 * Pure decision logic for the route-level auth middleware.
 *
 * Keeping this in a framework-free module makes it unit-testable without
 * Nuxt, and lets the middleware stay as a very thin adapter that only
 * knows how to wire the Nuxt specifics (`useFetch`, `navigateTo`).
 *
 * Each page declares its auth requirement via `definePageMeta({ auth })`:
 *
 * | Mode       | When to use                                       | Behavior                                                  |
 * |------------|---------------------------------------------------|-----------------------------------------------------------|
 * | `public`   | Pages that do not involve the user account at all | Always allowed. No call to `/api/auth/me`.                |
 * | `entry`    | Login / registration screens                      | Call `/api/auth/me`; redirect signed-in users to `/`.     |
 * | `required` | Everything else (default when unset)              | Call `/api/auth/me`; redirect signed-out users to `/login?redirect=…`. |
 *
 * The "public" mode intentionally skips the auth lookup so public pages do
 * not depend on the auth infrastructure.
 */

export type AuthMode = 'public' | 'entry' | 'required'

export type AuthUser = { id: string } | null

export type AuthDecision =
    | { kind: 'allow'; requiresAuthLookup: boolean }
    | { kind: 'redirect'; to: string; requiresAuthLookup: boolean }

export type AuthDecisionInput = {
    mode: AuthMode | undefined
    user: AuthUser
    /** Fully resolved path to redirect back to after login, including query. */
    requestedPath: string
}

/**
 * Decide what the middleware should do for a given route.
 *
 * The returned decision carries `requiresAuthLookup` so the middleware can
 * verify (via tests) that public pages never trigger the auth fetch.
 */
export function resolveAuthDecision(input: AuthDecisionInput): AuthDecision {
    const mode: AuthMode = input.mode ?? 'required'

    switch (mode) {
        case 'public':
            return { kind: 'allow', requiresAuthLookup: false }

        case 'entry':
            if (input.user) {
                return { kind: 'redirect', to: '/', requiresAuthLookup: true }
            }
            return { kind: 'allow', requiresAuthLookup: true }

        case 'required':
            if (input.user) {
                return { kind: 'allow', requiresAuthLookup: true }
            }
            return {
                kind: 'redirect',
                to: `/login?redirect=${encodeURIComponent(input.requestedPath)}`,
                requiresAuthLookup: true,
            }

        default: {
            const exhaustive: never = mode
            throw new Error(`unknown auth mode: ${String(exhaustive)}`)
        }
    }
}

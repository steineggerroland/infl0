import { runAuthMiddleware } from '~/utils/auth-middleware'

/**
 * Global route-level auth guard.
 *
 * Each page declares its auth requirement via `definePageMeta({ auth })`;
 * this middleware is a thin adapter that wires Nuxt specifics (fetch,
 * navigation) to the framework-agnostic core in `utils/auth-middleware.ts`.
 * All actual decision logic lives there so it can be unit-tested without
 * Nuxt — see `tests/unit/auth-decision.test.ts` and
 * `tests/unit/auth-middleware.test.ts`.
 */
export default defineNuxtRouteMiddleware(async (to) => {
    return runAuthMiddleware(
        { path: to.path, fullPath: to.fullPath, meta: to.meta as { auth?: 'public' | 'entry' | 'required' } },
        {
            fetchUser: async () => {
                const { data } = await useFetch<{
                    user: { id: string; email: string | null; name: string | null } | null
                }>('/api/auth/me', { credentials: 'include', key: 'auth-me' })
                return data.value?.user ?? null
            },
            navigate: (target) => navigateTo(target),
        },
    )
})

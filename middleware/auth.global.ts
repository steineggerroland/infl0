import { callWithNuxt } from '#app'
import type { H3Event } from 'h3'
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
    const nuxtApp = tryUseNuxtApp()
    const h3Event =
        import.meta.server && nuxtApp
            ? (useRequestEvent(nuxtApp) as H3Event | undefined)
            : undefined

    return runAuthMiddleware(
        { path: to.path, fullPath: to.fullPath, meta: to.meta as { auth?: 'public' | 'entry' | 'required' } },
        {
            fetchUser: async () => {
                if (import.meta.server && h3Event) {
                    const { getAuthUserForEvent } = await import(
                        '~/server/utils/auth-user-from-event',
                    )
                    return getAuthUserForEvent(h3Event)
                }
                try {
                    const data = await $fetch<{
                        user: { id: string; email: string | null; name: string | null }
                    }>('/api/auth/me', { credentials: 'include' })
                    return data.user
                } catch {
                    return null
                }
            },
            navigate: (target) => {
                // `runAuthMiddleware` awaits `fetchUser` first; without re-entering
                // the Nuxt app context, `navigateTo` → `useRouter` → `useNuxtApp` throws.
                if (nuxtApp) {
                    return callWithNuxt(nuxtApp, () => navigateTo(target))
                }
                return navigateTo(target)
            },
        },
    )
})

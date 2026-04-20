import { resolveAuthDecision, type AuthMode, type AuthUser } from './auth-decision'

/**
 * Framework-agnostic core of the route-level auth middleware.
 *
 * The Nuxt middleware in `middleware/auth.global.ts` delegates to this
 * function so the decision logic can be unit-tested without booting Nuxt.
 *
 * The caller is responsible for providing the side-effectful dependencies
 * (`fetchUser`, `navigate`). This lets tests verify that public pages
 * never trigger the auth lookup.
 */

export type AuthRouteLike = {
    path: string
    fullPath: string
    meta: { auth?: AuthMode }
}

export type AuthMiddlewareDeps<TNav = unknown> = {
    /** Resolves the current signed-in user, or `null` when signed out. */
    fetchUser: () => Promise<AuthUser>
    /**
     * Performs the navigation (typically `navigateTo` from Nuxt). The return
     * value is propagated to the caller so Nuxt can interrupt navigation.
     */
    navigate: (to: string) => TNav
}

export async function runAuthMiddleware<TNav>(
    to: AuthRouteLike,
    { fetchUser, navigate }: AuthMiddlewareDeps<TNav>,
): Promise<TNav | undefined> {
    // API paths are server concerns and must never be driven by the
    // SPA auth middleware. If a browser manually opens `/api/...`,
    // the request should resolve as an API response (JSON + status),
    // not trigger page-level auth redirects.
    if (to.path.startsWith('/api/')) {
        return undefined
    }

    const mode = to.meta.auth
    // First pass without a user so we can detect the "public" short-circuit
    // and skip the auth lookup entirely.
    const earlyDecision = resolveAuthDecision({
        mode,
        user: null,
        requestedPath: to.fullPath,
    })
    if (!earlyDecision.requiresAuthLookup) {
        if (earlyDecision.kind === 'redirect') return navigate(earlyDecision.to)
        return undefined
    }

    const user = await fetchUser()
    const decision = resolveAuthDecision({
        mode,
        user,
        requestedPath: to.fullPath,
    })

    if (decision.kind === 'redirect') {
        return navigate(decision.to)
    }
    return undefined
}

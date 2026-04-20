import type { H3Event } from 'h3'
import { prisma } from './prisma'
import { getSessionUserId } from './auth-session'

/**
 * Same identity resolution as `GET /api/auth/me`, without an internal HTTP
 * round-trip. Route middleware must not call `event.$fetch` to app routes:
 * that re-enters Nuxt/Vue router and can throw composable-context errors.
 */
export async function getAuthUserForEvent(event: H3Event): Promise<{
    id: string
    email: string | null
    name: string | null
} | null> {
    const userId = await getSessionUserId(event)
    if (!userId) return null

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
    })

    return user
}

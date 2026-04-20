import { describe, expect, it, vi } from 'vitest'
import { runAuthMiddleware } from '../../utils/auth-middleware'
import type { AuthMode } from '../../utils/auth-decision'

type RouteLike = {
  path: string
  fullPath: string
  meta: { auth?: AuthMode }
}

function makeRoute(path: string, mode?: AuthMode, fullPath = path): RouteLike {
  return { path, fullPath, meta: mode ? { auth: mode } : {} }
}

describe('runAuthMiddleware', () => {
  it('never fetches the user for a public route', async () => {
    const fetchUser = vi.fn()
    const navigate = vi.fn()

    await runAuthMiddleware(makeRoute('/help', 'public'), { fetchUser, navigate })

    expect(fetchUser).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('lets an auth entry through when the user is signed out', async () => {
    const fetchUser = vi.fn().mockResolvedValue(null)
    const navigate = vi.fn()

    await runAuthMiddleware(makeRoute('/login', 'entry'), { fetchUser, navigate })

    expect(fetchUser).toHaveBeenCalledOnce()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('redirects signed-in users away from auth entries', async () => {
    const fetchUser = vi.fn().mockResolvedValue({ id: 'u1' })
    const navigate = vi.fn().mockReturnValue('navigated')

    const result = await runAuthMiddleware(makeRoute('/login', 'entry'), {
      fetchUser,
      navigate,
    })

    expect(fetchUser).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/')
    expect(result).toBe('navigated')
  })

  it('redirects signed-out users on required routes with original path', async () => {
    const fetchUser = vi.fn().mockResolvedValue(null)
    const navigate = vi.fn().mockReturnValue('navigated')

    const result = await runAuthMiddleware(
      makeRoute('/feeds', undefined, '/feeds?foo=bar'),
      { fetchUser, navigate },
    )

    expect(fetchUser).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledExactlyOnceWith(
      '/login?redirect=%2Ffeeds%3Ffoo%3Dbar',
    )
    expect(result).toBe('navigated')
  })

  it('allows signed-in users on required routes without redirect', async () => {
    const fetchUser = vi.fn().mockResolvedValue({ id: 'u1' })
    const navigate = vi.fn()

    const result = await runAuthMiddleware(makeRoute('/feeds'), {
      fetchUser,
      navigate,
    })

    expect(fetchUser).toHaveBeenCalledOnce()
    expect(navigate).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('never calls navigate for a public route even when accidentally given a user fetcher that throws', async () => {
    const fetchUser = vi.fn().mockRejectedValue(new Error('should not be called'))
    const navigate = vi.fn()

    await expect(
      runAuthMiddleware(makeRoute('/help', 'public'), { fetchUser, navigate }),
    ).resolves.toBeUndefined()

    expect(fetchUser).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})

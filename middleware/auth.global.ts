export default defineNuxtRouteMiddleware(async (to) => {
  // Auth entry points: redirect away when already signed in.
  const authEntryPaths = ['/login', '/register']
  // Pages reachable without an account (auth entries + help centre, which is
  // linked from the password badges on the login / register screens).
  const publicPaths = [...authEntryPaths, '/help']
  const isAuthEntry = authEntryPaths.includes(to.path)
  const isPublic = publicPaths.includes(to.path)

  const { data } = await useFetch<{ user: { id: string; email: string | null; name: string | null } | null }>(
    '/api/auth/me',
    { credentials: 'include', key: 'auth-me' },
  )

  if (isAuthEntry && data.value?.user) {
    return navigateTo('/')
  }

  if (isPublic) return

  if (!data.value?.user) {
    const redirect = encodeURIComponent(to.fullPath)
    return navigateTo(`/login?redirect=${redirect}`)
  }
})

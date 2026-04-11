export default defineNuxtRouteMiddleware(async (to) => {
  // Nitro-API unter /api/* wird normalerweise vor dem Vue-Router bedient. Fehlt ein Handler
  // (z. B. altes Deployment), würde die App die URL sonst wie eine Seite behandeln: globale
  // Middleware redirectet ohne Session nach /login — Crawler-Header (Bearer) werden dabei ignoriert.
  if (to.path.startsWith('/api')) {
    return
  }

  const publicPaths = ['/login', '/register']
  const isPublic = publicPaths.includes(to.path)

  const { data } = await useFetch<{ user: { id: string; email: string | null; name: string | null } | null }>(
    '/api/auth/me',
    { credentials: 'include', key: 'auth-me' },
  )

  if (isPublic) {
    if (data.value?.user) {
      return navigateTo('/')
    }
    return
  }

  if (!data.value?.user) {
    const redirect = encodeURIComponent(to.fullPath)
    return navigateTo(`/login?redirect=${redirect}`)
  }
})

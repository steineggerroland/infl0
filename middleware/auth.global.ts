export default defineNuxtRouteMiddleware(async (to) => {
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

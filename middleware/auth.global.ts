export default defineNuxtRouteMiddleware(async (to) => {
  const isLogin = to.path === '/login'

  const { data } = await useFetch<{ user: { id: string; email: string | null; name: string | null } | null }>(
    '/api/auth/me',
    { credentials: 'include', key: 'auth-me' },
  )

  if (isLogin) {
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

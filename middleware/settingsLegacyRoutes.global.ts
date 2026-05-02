/**
 * Older bookmarks used separate routes for blocks that now live under
 * `/settings#…` only, so sidebar navigation stays a single-page scroll model.
 */
export default defineNuxtRouteMiddleware((to) => {
    if (to.path === '/settings/personalization')
        return navigateTo({ path: '/settings', hash: '#personalization' }, { replace: true })

    if (to.path === '/settings/privacy')
        return navigateTo({ path: '/settings', hash: '#privacy' }, { replace: true })
})

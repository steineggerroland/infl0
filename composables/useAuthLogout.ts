export function useAuthLogout() {
    async function logout() {
        await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        await navigateTo('/login')
    }
    return { logout }
}

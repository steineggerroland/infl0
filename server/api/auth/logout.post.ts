import { clearAuthCookie } from '../../utils/auth-session'

export default defineEventHandler((event) => {
  clearAuthCookie(event)
  return { ok: true }
})

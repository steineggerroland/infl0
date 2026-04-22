import { createError, defineEventHandler } from 'h3'
import { resolveUiPrefs, toStoredUiPrefs } from '../../../utils/ui-prefs'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

/**
 * GET /api/me/ui-prefs
 * Returns resolved UI preferences (theme, motion, per-surface readability).
 * Unset / invalid stored values fall back to defaults.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { uiPrefs: true },
  })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const resolved = resolveUiPrefs(user.uiPrefs)
  return toStoredUiPrefs(resolved)
})

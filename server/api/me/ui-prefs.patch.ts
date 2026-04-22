import { Prisma } from '@prisma/client'
import { createError, defineEventHandler, readBody } from 'h3'
import {
  applyUiPrefsPatch,
  resolveUiPrefs,
  toStoredUiPrefs,
  type UiPrefsPatch,
  type UiPrefsStored,
} from '../../../utils/ui-prefs'
import { getSessionUserId } from '../../utils/auth-session'
import { prisma } from '../../utils/prisma'

type PatchBody = UiPrefsPatch & { reset?: boolean }

function toStoredJson(p: UiPrefsStored): Prisma.InputJsonValue {
  return p as unknown as Prisma.InputJsonValue
}

/**
 * PATCH /api/me/ui-prefs
 * Body: `{ reset: true }` to clear, or a partial patch
 *       `{ theme?, motion?, surfaces?, seenFeatureAnnouncements? }`.
 *
 * Unknown / invalid fields are ignored (not rejected) so a newer client
 * sending a field a server release hasn't learned yet does not fail the
 * whole request; the server re-emits the resolved shape.
 */
export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = (await readBody(event).catch(() => null)) as PatchBody | null
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Expected JSON body' })
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { uiPrefs: true },
  })
  if (!existing) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (body.reset === true) {
    await prisma.user.update({
      where: { id: userId },
      data: { uiPrefs: Prisma.JsonNull },
    })
    return toStoredUiPrefs(resolveUiPrefs(null))
  }

  const current = resolveUiPrefs(existing.uiPrefs)
  const next = applyUiPrefsPatch(current, body)
  await prisma.user.update({
    where: { id: userId },
    data: { uiPrefs: toStoredJson(toStoredUiPrefs(next)) },
  })
  return toStoredUiPrefs(next)
})

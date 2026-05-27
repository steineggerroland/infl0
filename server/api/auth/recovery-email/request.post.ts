import { createError, readBody } from 'h3'
import { normalizeOptionalRecoveryEmail } from '~/utils/username'
import { getAuthUserForEvent } from '../../../utils/auth-user-from-event'
import { RECOVERY_EMAIL_VERIFY_PURPOSE, requestEmailOtp } from '../../../utils/email-otp'

export default defineEventHandler(async (event) => {
  const user = await getAuthUserForEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const body = await readBody(event).catch(() => null)
  const email = normalizeOptionalRecoveryEmail(typeof body?.email === 'string' ? body.email : null)
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Valid recovery email required' })
  }

  await requestEmailOtp({
    userId: user.id,
    email,
    purpose: RECOVERY_EMAIL_VERIFY_PURPOSE,
  })

  return { ok: true }
})

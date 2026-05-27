import { createError, readBody } from 'h3'
import { normalizeOptionalRecoveryEmail } from '~/utils/username'
import { prisma } from '../../../utils/prisma'
import { getAuthUserForEvent } from '../../../utils/auth-user-from-event'
import { consumeEmailOtp, RECOVERY_EMAIL_VERIFY_PURPOSE } from '../../../utils/email-otp'

export default defineEventHandler(async (event) => {
  const user = await getAuthUserForEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const body = await readBody(event).catch(() => null)
  const email = normalizeOptionalRecoveryEmail(typeof body?.email === 'string' ? body.email : null)
  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  if (!email || !/^\d{6}$/u.test(code)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid recovery email and code required' })
  }

  await consumeEmailOtp({
    userId: user.id,
    email,
    purpose: RECOVERY_EMAIL_VERIFY_PURPOSE,
    code,
  })

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      email,
      recoveryEmailVerifiedAt: new Date(),
    },
    select: { username: true, email: true, recoveryEmailVerifiedAt: true },
  })

  return { ok: true, user: updated }
})

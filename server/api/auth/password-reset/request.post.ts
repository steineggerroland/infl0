import { createError, readBody } from 'h3'
import { normalizeOptionalRecoveryEmail } from '~/utils/username'
import { prisma } from '../../../utils/prisma'
import { PASSWORD_RESET_PURPOSE, requestEmailOtp } from '../../../utils/email-otp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const email = normalizeOptionalRecoveryEmail(typeof body?.email === 'string' ? body.email : null)
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Valid recovery email required' })
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      recoveryEmailVerifiedAt: { not: null },
      srpSalt: { not: null },
      srpVerifier: { not: null },
    },
    select: { id: true, username: true },
  })
  if (!user) {
    throw createError({ statusCode: 400, statusMessage: 'Recovery is not available for this email yet' })
  }

  await requestEmailOtp({
    userId: user.id,
    email,
    purpose: PASSWORD_RESET_PURPOSE,
  })

  return { ok: true, username: user.username }
})

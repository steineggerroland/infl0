import { createError, readBody } from 'h3'
import { normalizeOptionalRecoveryEmail } from '~/utils/username'
import { prisma } from '../../../utils/prisma'
import { createSessionToken, setAuthCookie } from '../../../utils/auth-session'
import { consumeEmailOtp, PASSWORD_RESET_PURPOSE } from '../../../utils/email-otp'
import { hexToBigint } from '../../../utils/srp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const email = normalizeOptionalRecoveryEmail(typeof body?.email === 'string' ? body.email : null)
  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  const saltHex = typeof body?.saltHex === 'string' ? body.saltHex.trim().replace(/^0x/iu, '') : ''
  const verifierHex =
    typeof body?.verifierHex === 'string' ? body.verifierHex.trim().replace(/^0x/iu, '') : ''

  if (!email || !/^\d{6}$/u.test(code)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid recovery email and code required' })
  }
  if (!/^[0-9a-fA-F]+$/u.test(saltHex) || !/^[0-9a-fA-F]+$/u.test(verifierHex)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid salt or verifier' })
  }
  try {
    hexToBigint(saltHex)
    hexToBigint(verifierHex)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid salt or verifier' })
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      recoveryEmailVerifiedAt: { not: null },
    },
    select: { id: true },
  })
  if (!user) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired code' })
  }

  await consumeEmailOtp({
    userId: user.id,
    email,
    purpose: PASSWORD_RESET_PURPOSE,
    code,
  })

  await prisma.user.update({
    where: { id: user.id },
    data: {
      srpSalt: saltHex,
      srpVerifier: verifierHex,
      passwordHash: null,
    },
  })

  const token = await createSessionToken(user.id)
  setAuthCookie(event, token)

  return { ok: true }
})

import { createError, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { srpServerStep1, storeSrpChallenge } from '../../../utils/srp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const emailRaw = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!emailRaw) {
    throw createError({ statusCode: 400, statusMessage: 'Email required' })
  }

  const user = await prisma.user.findUnique({ where: { email: emailRaw } })
  if (!user?.srpSalt || !user.srpVerifier) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication failed' })
  }

  const { step1, BHex } = await srpServerStep1(emailRaw, user.srpSalt, user.srpVerifier)
  const challengeId = storeSrpChallenge(JSON.stringify(step1))

  return {
    challengeId,
    saltHex: user.srpSalt,
    BHex,
  }
})

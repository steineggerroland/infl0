import { createError, readBody } from 'h3'
import { normalizeUsername } from '~/utils/username'
import { prisma } from '../../../utils/prisma'
import { srpServerStep1, storeSrpChallenge } from '../../../utils/srp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const usernameRaw =
    typeof body?.username === 'string'
      ? body.username
      : typeof body?.email === 'string'
        ? body.email
        : ''
  const username = normalizeUsername(usernameRaw)
  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'Username required' })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user?.srpSalt || !user.srpVerifier) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication failed' })
  }

  const { step1, BHex } = await srpServerStep1(username, user.srpSalt, user.srpVerifier)
  const challengeId = await storeSrpChallenge(JSON.stringify(step1))

  return {
    challengeId,
    saltHex: user.srpSalt,
    BHex,
  }
})

import { createError, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import { createSessionToken, setAuthCookie } from '../../../utils/auth-session'
import { bigintToHex, hexToBigint, srpStep1FromState, takeSrpChallenge } from '../../../utils/srp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const challengeId = typeof body?.challengeId === 'string' ? body.challengeId : ''
  const AHex = typeof body?.AHex === 'string' ? body.AHex.trim() : ''
  const M1Hex = typeof body?.M1Hex === 'string' ? body.M1Hex.trim() : ''

  if (!challengeId || !AHex || !M1Hex) {
    throw createError({ statusCode: 400, statusMessage: 'challengeId, AHex and M1Hex required' })
  }

  const state = takeSrpChallenge(challengeId)
  if (!state) {
    throw createError({ statusCode: 401, statusMessage: 'Challenge expired or invalid' })
  }

  const step1 = srpStep1FromState(state)
  const A = hexToBigint(AHex)
  const M1 = hexToBigint(M1Hex)

  let M2: bigint
  try {
    M2 = await step1.step2(A, M1)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Authentication failed' })
  }

  const email = state.identifier.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication failed' })
  }

  const token = await createSessionToken(user.id)
  setAuthCookie(event, token)

  return { M2Hex: bigintToHex(M2) }
})

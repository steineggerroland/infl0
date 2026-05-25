import { createError, readBody } from 'h3'
import { timingSafeEqual } from 'node:crypto'
import { Prisma } from '~/generated/prisma/client'
import {
  isValidNewUsername,
  normalizeOptionalRecoveryEmail,
  normalizeUsername,
} from '~/utils/username'
import { prisma } from '../../../utils/prisma'
import { createSessionToken, setAuthCookie } from '../../../utils/auth-session'
import { hexToBigint } from '../../../utils/srp'

function inviteMatches(expected: string, received: string): boolean {
  const r = received.trim()
  if (!expected || !r) return false
  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(r, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * SRP registration: client sends salt + verifier only (see createVerifierAndSalt).
 * Requires NUXT_REGISTRATION_INVITE_CODE on the server; user submits the same value.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const expectedInvite = config.registrationInviteCode as string
  if (!expectedInvite?.length) {
    throw createError({ statusCode: 403, statusMessage: 'Registration is disabled' })
  }

  const body = await readBody(event).catch(() => null)
  const usernameRaw = typeof body?.username === 'string' ? body.username : ''
  const username = normalizeUsername(usernameRaw)
  const recoveryEmail = normalizeOptionalRecoveryEmail(
    typeof body?.recoveryEmail === 'string' ? body.recoveryEmail : null,
  )
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : null
  const saltHex = typeof body?.saltHex === 'string' ? body.saltHex.trim().replace(/^0x/iu, '') : ''
  const verifierHex =
    typeof body?.verifierHex === 'string' ? body.verifierHex.trim().replace(/^0x/iu, '') : ''
  const inviteCode = typeof body?.inviteCode === 'string' ? body.inviteCode : ''

  if (!username || !isValidNewUsername(username)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid username required' })
  }
  if (
    recoveryEmail === null &&
    typeof body?.recoveryEmail === 'string' &&
    body.recoveryEmail.trim().length > 0
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Valid recovery email required' })
  }
  if (!inviteMatches(expectedInvite, inviteCode)) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid invite code' })
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

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email: recoveryEmail,
        name: name || null,
        srpSalt: saltHex,
        srpVerifier: verifierHex,
        passwordHash: null,
      },
      select: { id: true, username: true, email: true, name: true },
    })

    const token = await createSessionToken(user.id)
    setAuthCookie(event, token)

    return { ok: true, user }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Username already taken' })
    }
    throw e
  }
})

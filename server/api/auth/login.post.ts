import bcrypt from 'bcryptjs'
import { createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { createSessionToken, setAuthCookie } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password required' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user?.passwordHash) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const token = await createSessionToken(user.id)
  setAuthCookie(event, token)

  return {
    user: { id: user.id, email: user.email, name: user.name },
  }
})

import { createError, defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { getSessionUserId } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { message: 'Authentication required' },
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { message: 'Authentication required' },
    })
  }

  return { user }
})

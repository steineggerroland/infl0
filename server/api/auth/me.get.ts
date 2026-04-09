import { prisma } from '../../utils/prisma'
import { getSessionUserId } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    return { user: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  })

  if (!user) {
    return { user: null }
  }

  return { user }
})

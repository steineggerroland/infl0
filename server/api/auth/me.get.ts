import { createError, defineEventHandler } from 'h3'
import { getAuthUserForEvent } from '../../utils/auth-user-from-event'

export default defineEventHandler(async (event) => {
  const user = await getAuthUserForEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { message: 'Authentication required' },
    })
  }

  return { user }
})

import { createError, defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { getSessionUserId } from '../../../utils/auth-session'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const readingNoteId = (getRouterParam(event, 'readingNoteId') ?? '').trim()
  if (!readingNoteId) {
    throw createError({ statusCode: 400, statusMessage: 'readingNoteId required' })
  }

  const readingNote = await prisma.readingNote.findUnique({
    where: { id: readingNoteId },
    select: { userId: true },
  })
  if (!readingNote) {
    throw createError({ statusCode: 404, statusMessage: 'Reading note not found' })
  }
  if (readingNote.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  await prisma.readingNote.deleteMany({ where: { id: readingNoteId, userId } })
  setResponseStatus(event, 204)
  return null
})

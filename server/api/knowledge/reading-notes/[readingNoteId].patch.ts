import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { normalizeReadingNoteTags } from '../../../../utils/reading-note-tags'
import { getSessionUserId } from '../../../utils/auth-session'
import { prisma } from '../../../utils/prisma'

type Body = {
  content?: string
  context?: string
  tags?: string[]
}

const MAX_CONTENT_LENGTH = 10_000
const MAX_CONTEXT_LENGTH = 2_000

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

  const body: Body = await readBody(event)
  const data: {
    content?: string
    context?: string | null
    userTags?: string[]
  } = {}

  if (Object.hasOwn(body, 'content')) {
    const content = body.content?.trim()
    if (!content) {
      throw createError({ statusCode: 400, statusMessage: 'Content is required' })
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      throw createError({ statusCode: 400, statusMessage: 'Content is too long' })
    }
    data.content = content
  }

  if (Object.hasOwn(body, 'context')) {
    const context = body.context?.trim() || null
    if (context && context.length > MAX_CONTEXT_LENGTH) {
      throw createError({ statusCode: 400, statusMessage: 'Context is too long' })
    }
    data.context = context
  }

  if (Object.hasOwn(body, 'tags')) {
    if (!Array.isArray(body.tags)) {
      throw createError({ statusCode: 400, statusMessage: 'Tags must be an array' })
    }
    data.userTags = normalizeReadingNoteTags(body.tags)
  }

  if (!Object.keys(data).length) {
    throw createError({ statusCode: 400, statusMessage: 'No reading note changes provided' })
  }

  return prisma.readingNote.update({
    where: { id: readingNoteId },
    data,
  })
})

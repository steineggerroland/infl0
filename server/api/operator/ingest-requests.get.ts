import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireOperatorUser } from '../../utils/operator-access'

/**
 * GET /api/operator/ingest-requests
 *
 * Operator-only append-only view of recent TopicKnowledgeCrawler ingest calls.
 */
export default defineEventHandler(async (event) => {
  await requireOperatorUser(event)

  const rows = await prisma.crawlerIngestRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const latestTen = rows.slice(0, 10)
  const successRows = rows.filter((row) => row.status === 'success')
  const rejectedRows = rows.filter((row) => row.status === 'rejected')

  return {
    summary: {
      latestTenGreen: latestTen.length > 0 && latestTen.every((row) => row.status === 'success'),
      latestTenCount: latestTen.length,
      successCount: successRows.length,
      rejectedCount: rejectedRows.length,
      articlesAccepted: rows.reduce((sum, row) => sum + row.articlesAccepted, 0),
      episodesAccepted: rows.reduce((sum, row) => sum + row.episodesAccepted, 0),
      subscribersAffected: rows.reduce((sum, row) => sum + row.subscribersAffected, 0),
    },
    items: rows.map((row) => ({
      id: row.id,
      status: row.status,
      httpStatus: row.httpStatus,
      failureCategory: row.failureCategory,
      failureMessage: row.failureMessage,
      crawlKey: row.crawlKey,
      itemKind: row.itemKind,
      contentId: row.contentId,
      articlesAccepted: row.articlesAccepted,
      episodesAccepted: row.episodesAccepted,
      timelineInserted: row.timelineInserted,
      subscribersAffected: row.subscribersAffected,
      requestPreview: row.requestPreview,
      createdAt: row.createdAt.toISOString(),
    })),
  }
})

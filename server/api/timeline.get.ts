import { defineEventHandler } from 'h3'
import { handleInflowRequest } from '../utils/inflow-handler'

/**
 * GET /api/timeline — **deprecated alias** for `/api/inflow`.
 *
 * Kept around for one release so external callers and any cached
 * client do not break instantly during the timeline → inflow rename
 * (see `docs/planned/onboarding-and-inflow-cards.md`). The handler
 * forwards verbatim; the deprecation entry will move this file out
 * in the next minor release.
 */
export default defineEventHandler(async (event) => {
  return handleInflowRequest(event)
})

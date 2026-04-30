import { defineEventHandler } from 'h3'
import { handleInflowRequest } from '../utils/inflow-handler'

/**
 * GET /api/inflow?limit=20&offset=0&showRead=1
 *
 * Returns the user's inflow as a discriminated union of card types
 * (`article` and `onboarding`). By default, article rows with `read_at`
 * set are omitted; pass `showRead=1` to include them. Onboarding cards
 * never participate in show-read or in the read/unread stats — they
 * are surfaced exclusively from `User.uiPrefs.onboardingHidden`.
 *
 * `stats.total` / `stats.unread` count article rows only and let the
 * client show empty states when everything is read.
 *
 * `/api/timeline` is a deprecated alias for one release; both paths
 * forward to the same handler in `server/utils/inflow-handler.ts`.
 */
export default defineEventHandler(async (event) => {
  return handleInflowRequest(event)
})

import type { TkcSourceHealthStatus } from './source-health-display'

/**
 * Per-feed URL / `crawlKey` for each TopicKnowledgeCrawler `sourceHealthStatus`
 * (local `npm run db:seed` + unit contract fixtures).
 *
 * Uses a deterministic path under example.com — not fetched; DB key only.
 */
export function seedSourceStatusFeedUrl(health: TkcSourceHealthStatus): string {
  return `https://example.com/seed/source-status/${health}.xml`
}

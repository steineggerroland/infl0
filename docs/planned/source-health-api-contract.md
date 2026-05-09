# Package: Source health API contract

## Status

Draft

## Goal

Add an infl0 API contract that accepts source processing status from the external crawler pipeline (TopicKnowledgeCrawler / n8n) and stores it in a form usable by both user-facing source views and operator diagnostics.

When shipped, the crawler can report per **`crawlKey`**:

- crawl status and timestamps
- next expected crawl time
- candidate / processed / skipped / error counts
- detected source policy hints
- derived source health
- operator attention flags

infl0 should then have **one canonical place** to read source health from, instead of relying on n8n data tables alone.

## Non-goals

- Do not implement the `/feeds` page UI in this package.
- Do not implement the operator dashboard in this package.
- Do not move crawling into infl0.
- Do not store raw article bodies, LLM prompts, or full crawler logs in the source-status table.
- Do not require a full run-history model in the first version; keep v1 focused on **latest known status per source**.

## Dependencies

- Existing crawler auth helper: `server/utils/crawler-auth.ts`
- Existing crawler endpoints: `GET /api/crawler/sources`, `POST /api/crawler/ingest`
- Existing `UserFeed.crawlKey` model in `prisma/schema.prisma`
- TopicKnowledgeCrawler steps: `finalize_crawl_run`, `inspect_source_policy`, `derive_source_health`

## Acceptance criteria

1. Prisma schema contains a latest-status model keyed by **`crawlKey`**, e.g. **`SourceStatus`** mapped to **`source_statuses`**.
2. A new authenticated crawler endpoint exists: **`POST /api/crawler/source-status`**.
3. The endpoint accepts the current TopicKnowledgeCrawler/n8n status payload, including at minimum:
   - `crawlKey`
   - `sourceStatus`, `sourceHealthStatus`, `sourceHealthReason`, `sourceHealthJson`
   - `operatorAttention`, `operatorAttentionReason`
   - `lastCrawlStatus`, `lastCrawlStartedAt`, `lastCrawlFinishedAt`, `nextAllowedCrawlAt`, `lastSuccessfulCrawlAt`, `lastCrawlError`
   - `crawlCandidateCount`, `crawlSkippedCount`, `crawlProcessedCount`, `crawlUnchangedCount`, `crawlFetchErrorCount`, `crawlLlmFailedCount`, `consecutiveErrorCount`
   - `detectedPolicy`, `effectivePolicy`
4. The endpoint **upserts** by `crawlKey`.
5. The endpoint uses the **same auth behavior** as `POST /api/crawler/ingest`.
6. The endpoint validates payload shape and **rejects** missing `crawlKey`.
7. **`GET /api/crawler/sources`** remains unchanged for crawler discovery.
8. A read endpoint exists for app usage, e.g. **`GET /api/source-statuses`**, returning statuses only for the signed-in user’s **active** feeds (joined via `crawlKey`).
9. Unit/API tests cover: unauthorized request; missing `crawlKey`; successful upsert; signed-in user sees only status for their own active sources.
10. `.env.example` and crawler integration docs mention the new endpoint.

## Implementation notes

### Suggested Prisma model

```prisma
model SourceStatus {
  crawlKey String @id @map("crawl_key")

  sourceStatus        String?  @map("source_status")
  sourceHealthStatus  String?  @map("source_health_status")
  sourceHealthReason  String?  @map("source_health_reason")
  sourceHealthJson    Json?    @map("source_health_json")
  operatorAttention   Boolean  @default(false) @map("operator_attention")
  operatorAttentionReason String? @map("operator_attention_reason")

  lastCrawlStatus       String?   @map("last_crawl_status")
  lastCrawlStartedAt    DateTime? @map("last_crawl_started_at")
  lastCrawlFinishedAt   DateTime? @map("last_crawl_finished_at")
  nextAllowedCrawlAt    DateTime? @map("next_allowed_crawl_at")
  lastSuccessfulCrawlAt DateTime? @map("last_successful_crawl_at")
  lastCrawlError        String?   @map("last_crawl_error") @db.Text

  crawlCandidateCount   Int? @map("crawl_candidate_count")
  crawlSkippedCount     Int? @map("crawl_skipped_count")
  crawlProcessedCount   Int? @map("crawl_processed_count")
  crawlUnchangedCount   Int? @map("crawl_unchanged_count")
  crawlFetchErrorCount  Int? @map("crawl_fetch_error_count")
  crawlLlmFailedCount   Int? @map("crawl_llm_failed_count")
  consecutiveErrorCount Int? @map("consecutive_error_count")

  detectedPolicy Json? @map("detected_policy")
  effectivePolicy Json? @map("effective_policy")

  updatedAt DateTime @updatedAt @map("updated_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("source_statuses")
}
```

### Suggested crawler payload shape (camelCase)

TopicKnowledgeCrawler output fields may use snake_case; **prefer explicit mapping in n8n** so the infl0 API stays stable.

```json
{
  "crawlKey": "https://example.com/feed.xml",
  "sourceStatus": "ready",
  "sourceHealthStatus": "degraded",
  "sourceHealthReason": "last_crawl_partial_failed",
  "sourceHealthJson": {},
  "operatorAttention": true,
  "operatorAttentionReason": "fetch_errors_without_processed_items",
  "lastCrawlStatus": "partial_failed",
  "lastCrawlStartedAt": "2026-05-09T08:16:00.000Z",
  "lastCrawlFinishedAt": "2026-05-09T08:19:53.000Z",
  "nextAllowedCrawlAt": "2026-05-09T11:16:00.000Z",
  "lastSuccessfulCrawlAt": null,
  "lastCrawlError": "5 fetch error(s)",
  "crawlCandidateCount": 7,
  "crawlSkippedCount": 2,
  "crawlProcessedCount": 0,
  "crawlUnchangedCount": 0,
  "crawlFetchErrorCount": 5,
  "crawlLlmFailedCount": 0,
  "consecutiveErrorCount": 1,
  "detectedPolicy": { "http_status": 200, "cache_max_age_seconds": 900 },
  "effectivePolicy": { "crawl_interval_minutes": 180 }
}
```

### Risks / rollback

- **`crawlKey` as primary key**: renaming or normalizing keys requires migration strategy; keep normalization aligned with `server/utils/feed-url.ts` and ingest.
- Empty table until crawler posts: downstream UIs must handle **no row** for a subscribed feed.

## Links

- PR:
- Discussion:
- TopicKnowledgeCrawler: https://github.com/steineggerroland/TopicKnowledgeCrawler
- Related packages: [`feed-source-health-status.md`](./feed-source-health-status.md), [`operator-source-observability.md`](./operator-source-observability.md)

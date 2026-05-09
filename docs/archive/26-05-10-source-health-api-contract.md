# Package: Source health API contract

## Status

Done (2026-05-10)

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

## What shipped

- **Prisma `SourceStatus`** on table **`source_statuses`**, keyed by **`crawlKey`** (migration
  `20260510120000_source_statuses`).
- **`POST /api/crawler/source-status`** — same auth as **`POST /api/crawler/ingest`**
  (`requireCrawlerAuth`); **upsert** by normalized `crawlKey` (`normalizeFeedUrl`); body
  supports **camelCase** or **snake_case** (`server/utils/source-status-crawler-payload.ts`).
- **`GET /api/source-statuses`** — session user; one item per **active** `UserFeed`, with
  **`latest`** either the joined **`SourceStatus`** snapshot (ISO date strings in JSON) or
  **`null`** when the crawler has not posted yet.
- **Tests:** `tests/unit/source-status-crawler-payload.test.ts`,
  `tests/unit/api-crawler-source-status.test.ts`, `tests/unit/api-source-statuses.test.ts`.
- **`GET /api/crawler/sources`** unchanged.

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

## Acceptance criteria (original)

All ten criteria from the planned package are met for this API slice (see git history /
[`CHANGELOG.md`](../CHANGELOG.md) **[Unreleased]**).

## Implementation notes

### Prisma model (as shipped)

Matches the planned `SourceStatus` / `source_statuses` shape in `prisma/schema.prisma`.

### Upsert merge semantics (partial updates)

**`POST /api/crawler/source-status`** distinguishes **absent** keys from **explicit null**:

- A key **omitted** from the JSON (neither camelCase nor snake_case alias present) is **not**
  included in Prisma’s `update` object — the column keeps its previous value.
- A nullable field sent as **`null`** is stored as SQL **NULL** (or `JsonNull` for JSON columns).
- On **first create**, omitted nullable columns are unset (NULL); **`operator_attention`** uses
  the DB default (**`false`**) when the key is omitted. If **`operatorAttention`** is sent, it must
  be a boolean (`true` / **`false`**), not JSON null.

So **delta / n8n step payloads are safe**: you do **not** need a full snapshot every time unless
you choose to send one.

### Crawler payload shape (camelCase or snake_case)

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
- Empty table until crawler posts: downstream UIs must handle **`latest: null`** for a subscribed feed.

## Links

- PR:
- Discussion:
- TopicKnowledgeCrawler: https://github.com/steineggerroland/TopicKnowledgeCrawler
- Follow-up packages: [`../planned/feed-source-health-status.md`](../planned/feed-source-health-status.md), [`../planned/operator-source-observability.md`](../planned/operator-source-observability.md)

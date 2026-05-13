# Operator runbook

Audience: people who **run an infl0 instance** (self-hoster, small-team ops).
For build/test/CI guidance see [`DEVELOPING.md`](./DEVELOPING.md); for the
Vercel/Neon deploy pipeline see [`DEPLOYING.md`](./DEPLOYING.md).

## What the operator area is

`/operator/sources` is a **technical status board** over every `crawlKey` the
infl0 instance has seen — not only the sources the signed-in operator
subscribes to. It is meant for triage: spot failing or blocked feeds, see
recent candidate / processed / fetch-error / LLM-failure counts, and read
the hints the crawler attached (HTTP status, `Retry-After`, `Cache-Control`).

The board reuses the same source-health vocabulary as the user-facing
`/feeds` page (`failing`, `blocked`, `degraded`, `needs_setup`, `pending`,
`quiet`, `paused`, `healthy`), with more technical detail visible per row.

## Access model (Phase 1: env allowlist)

Operator access is gated by **`NUXT_OPERATOR_EMAILS`**: a comma-separated
list of emails. A request reaches `/operator/sources` or
`GET /api/operator/source-statuses` only when the signed-in user's email —
after `trim().toLowerCase()` — appears in the list.

```bash
# .env / deployment env
NUXT_OPERATOR_EMAILS=ops@example.com, alice@example.org
```

What this means concretely:

- **Identity coupling is by string, not by foreign key.** Renaming a user's
  email (when that ever becomes a feature) silently revokes their operator
  access until the env var is updated.
- **No runtime management.** Adding or removing an operator requires a
  deploy / restart. There is no in-app UI to promote users.
- **Empty or typo-only allowlist ⇒ 403 for everyone.** Operator access is
  by design impossible to gain without deploy permission.
- **Logged at boot.** The server prints one line at startup:

  ```text
  [operator-access] 2 operator emails configured
  [operator-access] ignoring 1 invalid operator email in NUXT_OPERATOR_EMAILS (missing `@…`): broken
  ```

  Watch for those warnings the first time you deploy.

This is a deliberate **Phase 1** decision: deployment config is the trust
boundary. The follow-up plan (DB role / `User.isOperator`) is captured in
[`docs/archive/26-05-13-operator-source-observability.md`](./archive/26-05-13-operator-source-observability.md).

## Reading the board

| Column | Meaning |
|--------|---------|
| **Source / crawl key** | Display title (if any), normalised `crawlKey`, subscriber count |
| **Type** | `SourceStatus.sourceStatus` (e.g. `ready`, `paused`) |
| **Health** | Status dot + canonical TKC value (`healthy`, `degraded`, …) |
| **Attention reason** | `operatorAttentionReason` first, then `sourceHealthReason` |
| **Last crawl** | `lastCrawlStatus` from the most recent run |
| **Consecutive errors** | `consecutiveErrorCount` (resets to `0` on success) |
| **Candidates / Processed / Skipped** | Counts from the latest crawl run |
| **Fetch errors / LLM failures** | Per-run failure counts |
| **Next allowed crawl** | `nextAllowedCrawlAt` (localised in the cell) |
| **HTTP / retry / cache** | Hints from `sourceHealthJson`, `detectedPolicy`, `effectivePolicy` (first match wins) |

Sort order: rows flagged `operatorAttention === true` first, then by health
severity (`blocked` → `failing` → `degraded` → `needs_setup` → `quiet` →
`pending` → `paused` → `healthy`), then by `crawlKey` ASC.

Filters narrow the table to **Attention only**, **Failing / degraded**,
**Needs setup**, **Blocked**, or **Quiet** without changing sort order.

## Where the data comes from

- Status rows are upserted by the crawler via
  **`POST /api/crawler/source-status`** (auth: `NUXT_CRAWLER_API_KEY`). See
  [`DEVELOPING.md` → Crawler → infl0](./DEVELOPING.md#crawler--infl0-topicknowledgecrawler--n8n).
- Subscriber counts come from the `UserFeed` table (active + paused
  subscriptions sharing a `crawlKey`).
- The page reads **`GET /api/operator/source-statuses`** with the active
  filter; the endpoint is operator-guarded by the same allowlist.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Logged-in user gets `403` on `/operator/sources` | Email not in `NUXT_OPERATOR_EMAILS`, or only invalid entries (no `@…`) | Update the env var, restart; check boot log |
| Boot log says `NUXT_OPERATOR_EMAILS is empty` | Env var unset in this environment | Set it in the deployment env (Vercel / docker-compose / shell) and restart |
| Table is empty | No `source_statuses` rows yet for this instance | Wait for the crawler to post, or invoke `POST /api/crawler/source-status` manually |
| Attention column shows `Attention` without a reason | Crawler sent `operatorAttention: true` without `operatorAttentionReason` | Improve the crawler payload; the page falls back to `sourceHealthReason` |
| Hints columns show `—` | Crawler did not attach `sourceHealthJson` / policy keys | Add `httpStatus`, `retryAfter`, `cacheControl` in the upsert payload |

## Manual sanity checks

```bash
# Confirm 401 without a session cookie:
curl -i https://infl0.example/api/operator/source-statuses

# Confirm 403 with a non-operator session cookie:
curl -i -H "Cookie: …non-operator session…" https://infl0.example/api/operator/source-statuses

# Happy path (operator cookie):
curl -s -H "Cookie: …operator session…" \
  'https://infl0.example/api/operator/source-statuses?filter=blocked' | jq
```

## Related

- Crawler ingest contract: [`DEVELOPING.md` → Crawler → infl0](./DEVELOPING.md#crawler--infl0-topicknowledgecrawler--n8n)
- Source health vocabulary: [`archive/26-05-10-source-health-api-contract.md`](./archive/26-05-10-source-health-api-contract.md)
- User-facing health UX: [`archive/26-05-10-feed-source-health-status.md`](./archive/26-05-10-feed-source-health-status.md)
- Shipped scope of this board: [`archive/26-05-13-operator-source-observability.md`](./archive/26-05-13-operator-source-observability.md)

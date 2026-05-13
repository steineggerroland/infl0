# Package: Operator source observability

## Status

**Shipped** (2026-05-13). See [`../CHANGELOG.md`](../CHANGELOG.md) **[Unreleased]**.

## Goal

A simple, gated operator area that surfaces source-processing health,
crawler load, and early warning signals **across every source the instance
knows** — not just the operator's own subscriptions. Operators should be
able to answer:

- Which sources are failing or partially failing?
- Which sources create the most candidates and detail fetches?
- Which sources cause LLM load?
- Which sources are blocked by third-party sites?
- Which sources need configuration or selector work?
- Which sources are quiet, stale, or suspiciously dominant?

## What shipped

- **Page `/operator/sources`** (`pages/operator/sources.vue`) with:
  - Compact summary band: total sources, needing attention, failing,
    degraded, recent candidates / processed / fetch errors / LLM failures.
  - Table sorted **attention-first**, then by health severity
    (`blocked` → `failing` → `degraded` → `needs_setup` → `quiet` →
    `pending` → `paused` → `healthy`), then by `crawlKey`.
  - Columns: source / crawl key, type, health, attention reason, last
    crawl status, consecutive errors, candidates / processed / skipped,
    fetch errors, LLM failures, next allowed crawl, hints
    (HTTP status / `Retry-After` / `Cache-Control` from
    `sourceHealthJson`, `detectedPolicy`, `effectivePolicy`).
  - Filters: *Attention only*, *Failing / degraded*, *Needs setup*,
    *Blocked*, *Quiet* (URL-driven via `?filter=`).

- **API `GET /api/operator/source-statuses`** (`server/api/operator/source-statuses.get.ts`):
  joins `SourceStatus` with subscriber counts from `UserFeed`; same
  filter set as the page; returns `{ filter, summary, items }`.

- **Access gate**: `requireOperatorUser`
  (`server/utils/operator-access.ts`) checks the signed-in user's email
  against `NUXT_OPERATOR_EMAILS` (comma-separated, `trim().toLowerCase()`
  applied to both sides). Phase 1 design — see *Access model* below.
  Invalid entries (without `@…` shape) are dropped at parse time; the
  Nitro plugin `server/plugins/operator-access-boot-log.ts` prints a
  one-line summary at server boot:

  ```text
  [operator-access] 2 operator emails configured
  [operator-access] ignoring 1 invalid operator email in NUXT_OPERATOR_EMAILS (missing `@…`): broken
  ```

- **i18n**: `operatorSources.*` keys in `i18n/locales/{de,en}.json`
  (title, intro, filter labels, column headers, summary headings,
  `errorLoad`, `attention`, `empty`, `subscribers`).

- **Playwright**: new project `chromium-operator` in
  `playwright.config.ts` with `tests/e2e/operator-auth.setup.ts`
  (SRP login for `operator@localhost`) and
  `tests/e2e/authed/operator-sources.spec.ts`. The legacy
  `chromium-authed` project ignores the operator spec so the two
  roles never share storage state.

- **BDD**: `features/operator_sources.feature` covers the
  non-operator 403 path and the operator happy path; glue lives in
  `features/steps/operator.steps.js`.

- **Unit tests**: `tests/unit/api-operator-source-statuses.test.ts`
  (filters, sort, 401/403 guard, summary counts) and
  `tests/unit/operator-access.test.ts` (parse hardening + boot-log
  warnings).

- **Docs**: dedicated runbook [`../OPERATOR.md`](../OPERATOR.md),
  env reference in [`../DEPLOYING.md`](../DEPLOYING.md), test/setup
  notes in [`../DEVELOPING.md`](../DEVELOPING.md), changelog under
  [`../CHANGELOG.md`](../CHANGELOG.md) **[Unreleased]**.

## Acceptance criteria — final state

All ten criteria from the original planned package are met:

1. Protected operator route `/operator/sources` exists. ✓
2. Access is denied server-side (`requireOperatorUser`) for both page
   and API unless `NUXT_OPERATOR_EMAILS` contains the user email. ✓
3. Page lists all known sources (`SourceStatus.findMany()` over the
   whole table). ✓
4. Default sort prioritises attention rows, then health severity. ✓
5. Operational columns include source name / crawl key, type, health,
   attention reason, last crawl status, consecutive errors, candidates,
   processed, skipped, fetch errors, LLM failures, next allowed crawl,
   HTTP / retry-after / cache hints. ✓
6. Filters: attention; failing/degraded; needs setup; blocked; quiet. ✓
7. Summary band totals and recent counters. ✓
8. Tests cover unauthorised access (401/403), authorised happy path,
   sort, summary counts (unit + E2E + BDD). ✓
9. Page is utilitarian (table-first, no marketing cards). ✓
10. Subscriber count from `UserFeed` joined on `crawlKey`. ✓

## Access model (Phase 1 → Phase 2)

**Phase 1 (shipped).** Operator status lives in deployment configuration
(`NUXT_OPERATOR_EMAILS`) rather than the database. Pros: no schema /
migration, infra-bounded trust, easy bootstrap, simple tests. Cons: no
runtime management, no audit trail, identity coupled by string (an email
change silently revokes access).

**Phase 2 (planned, deferred).** Promote operator status to a real DB
field on `User` (e.g. `User.isOperator boolean`, default `false`) with
a small CLI / one-off script (`npm run promote-operator <email>`) and
keep `NUXT_OPERATOR_EMAILS` as a **bootstrap allowlist** that wins if
nobody is marked in the DB. Trigger: more than one operator surface,
audit requirements, or a User-changes-email feature. See
[`docs/OPERATOR.md`](../OPERATOR.md) → *Access model*.

## Follow-ups (not in this package)

- **Phase 2 access model** as above (DB role + bootstrap env).
- **Operator actions on rows**: trigger re-crawl, pause/resume a source
  globally, attach an operator note.
- **Historical runs / charts**: depends on a run-history table; not
  built yet.
- **Source dominance / underrepresentation analysis**: aggregate share
  of inflow across users per source.
- **Policy editing**: surface `detectedPolicy` vs `effectivePolicy` and
  let operators override safe subsets.
- **Multiple operator surfaces** (e.g. `/operator/users`,
  `/operator/crawler-runs`): would trigger Phase 2.

## Links

- PR: [#19](https://github.com/steineggerroland/infl0/pull/19) (initial
  scope + tests) and follow-ups stacked on top.
- Related (shipped, source-health stack):
  - [`26-05-10-source-health-api-contract.md`](./26-05-10-source-health-api-contract.md)
  - [`26-05-10-feed-source-health-status.md`](./26-05-10-feed-source-health-status.md)

# Package: Operator source observability

## Status

Draft

## Goal

Add a simple **password-protected** (or equivalently gated) operator area that shows source-processing health, crawler load, and early warning signals **across all sources**.

Operators should be able to answer:

- Which sources are failing or partially failing?
- Which sources create the most candidates and detail fetches?
- Which sources cause LLM load?
- Which sources are blocked by third-party sites?
- Which sources need configuration or selector work?
- Which sources are quiet, stale, or suspiciously dominant?

## Non-goals

- Do not build a full multi-role admin system yet.
- Do not expose operator data to normal users.
- Do not implement policy editing in the first version.
- Do not implement charts that require historical run storage unless the API package adds that storage first.
- Do not move n8n workflow management into infl0.

## Dependencies

- [`../archive/26-05-10-source-health-api-contract.md`](../archive/26-05-10-source-health-api-contract.md)
- Source health fields posted by TopicKnowledgeCrawler / n8n
- Existing auth/session utilities
- One simple operator access mechanism, for example:
  - environment variable operator password,
  - invite-code style shared secret, or
  - existing user email allowlist

## Acceptance criteria

1. A protected operator route exists, e.g. **`/operator/sources`**.
2. Access is **denied** unless the operator secret / allowlist condition is met (**server-side** for page and any backing APIs).
3. The page lists **all known** source statuses, not only sources for the current user.
4. Default sort prioritizes sources needing attention, e.g.:
   - `operatorAttention === true`
   - `blocked`
   - `failing`
   - `degraded`
   - `needs_setup`
5. Operational columns include at minimum:
   - source name / crawl key
   - type
   - health status
   - operator attention reason
   - last crawl status
   - consecutive error count
   - candidate count
   - processed count
   - skipped count
   - fetch error count
   - LLM failure count
   - next allowed crawl time
   - detected HTTP status / retry-after / cache hints when present
6. Basic filters exist: attention only; failing/degraded; needs setup; blocked; quiet.
7. Compact **summary band**: total sources; sources needing attention; failed; degraded; total recent candidates; total recent processed; total recent fetch errors; total recent LLM failures.
8. Tests cover: unauthorized access denied; authorized access allowed; attention sources sorted first; summary counts render.
9. Page is **utilitarian**: optimize for scanning and repeated operations, not marketing-style cards.

## Implementation notes

- Start minimal: a server route reads all `SourceStatus` rows and joins source labels from `UserFeed` where available; if multiple users subscribe to one `crawlKey`, show **subscriber count**.
- Operator status uses the **same source-health vocabulary** as the user-facing feed page, with **more technical detail** visible.

### Environment (pick one and document)

Examples:

- `NUXT_OPERATOR_PASSWORD=`
- or `NUXT_OPERATOR_EMAILS=admin@example.com,ops@example.com`

Document the chosen approach in **`.env.example`** and **`docs/DEPLOYING.md`**.

### Future follow-ups

- Policy editing
- Historical run charts
- Source dominance / underrepresentation analysis
- Trigger re-crawl action
- Pause/resume source

## Links

- PR:
- Discussion:
- Related: [`../archive/26-05-10-source-health-api-contract.md`](../archive/26-05-10-source-health-api-contract.md), [`feed-source-health-status.md`](./feed-source-health-status.md)

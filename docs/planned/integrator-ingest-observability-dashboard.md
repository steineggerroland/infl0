# Package: Integrator ingest observability dashboard

## Status

Draft

## Goal

Give TopicKnowledgeCrawler integrators and operators a protected view of recent
ingest activity so they can answer: is delivery working, what changed in each
request, and why was a request rejected?

## Non-goals

- Replacing the existing E2E ingest contract tests.
- Exposing crawler request bodies to regular readers.
- Building a general log viewer for every server request.
- Making the dashboard public or unauthenticated.

## Dependencies

- Existing crawler ingest endpoint and TKC fixture contract tests.
- Existing operator allowlist model and protected operator routes.
- SourceStatus/operator attention model for surfacing failures.

## Acceptance criteria

1. A protected integrator dashboard is reachable only with the same operator
   authorization model as `/operator/sources`.
2. The dashboard shows the latest ingest requests, including outcome, timestamp,
   content kind, crawl key/source, and counts such as accepted articles,
   accepted episodes, rejected items, and affected subscribers.
3. The dashboard summarizes recent health, e.g. "last 10 requests green" or
   which recent requests failed.
4. Rejected requests show actionable details: invalid API key, unsupported
   structure, validation failure, unsupported section payload, or processing
   error.
5. For debugging, the dashboard stores enough request context to understand
   what infl0 received while avoiding exposure to regular users.
6. BDD scenarios cover Ingo's dashboard expectations; existing Playwright E2E
   contract tests remain the API-integrity guard.

## Implementation notes

- Likely route: `/operator/ingest` or `/operator/integrations`.
- Persist ingest attempts separately from `SourceStatus` so rejected requests
  with bad keys or malformed structure are observable even when no source row
  can be updated.
- Store request metadata and a bounded/sanitized body preview, not unlimited
  raw payloads.
- Consider redaction rules before persisting headers, crawler keys, or content
  bodies.
- Use operator-facing copy; this is diagnostic tooling, not reader UX.

## Links

- PR:
- Discussion:

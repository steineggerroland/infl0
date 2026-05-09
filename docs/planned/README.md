# Planned feature packages

This folder contains **concrete implementation packages**: bounded scope,
order, acceptance criteria — separate from the larger idea pool in
[`../ROADMAP.md`](../ROADMAP.md).

## Convention

- **One file per package** (or per larger theme), e.g.
  `some-feature-package.md`.
- At the top: **goal**, **non-goals**, **dependencies**, optional **estimate /
  risk**.
- At the bottom: **user stories** or a checklist, **definition of done**, links to
  PRs/issues when available.
- New package: copy [`_template.md`](./_template.md), use `kebab-case.md` for
  the file name.
- When a package ships: move it to [`../archive/`](../archive/) and drop it from
  the index below.

## Index

| Package | Summary | Status |
|--------|--------|--------|
| [`bdd-persona-coverage-wave-1.md`](./bdd-persona-coverage-wave-1.md) | Add first BDD scenario wave for new-user, privacy-sensitive, and power-user personas | Draft |
| [`ci-remote-e2e-smoke-strategy.md`](./ci-remote-e2e-smoke-strategy.md) | Decide and document remote CI strategy for smoke E2E gates | Draft |
| [`source-health-api-contract.md`](./source-health-api-contract.md) | Canonical `SourceStatus` storage + crawler upsert + user-scoped read API | Draft |
| [`feed-source-health-status.md`](./feed-source-health-status.md) | Calm source health labels and timing on `/feeds` (no operator dashboard) | Draft |
| [`operator-source-observability.md`](./operator-source-observability.md) | Protected `/operator/sources` global health table and summary band | Draft |

*(Add a row when a new package markdown is created.)*

## Prioritized backlog (recommended working order)

Use this order when choosing what to implement next. **Revisit** after each
package ships or when dependencies change.

| Priority | Package | Rationale |
|:--------:|---------|-----------|
| **P0** | [`source-health-api-contract.md`](./source-health-api-contract.md) | **Foundation** for feeds health + operator views; crawler can start posting as soon as this lands. |
| **P1** | [`feed-source-health-status.md`](./feed-source-health-status.md) | Direct user value on `/feeds`; depends only on P0 (+ existing feeds APIs). |
| **P2** | [`operator-source-observability.md`](./operator-source-observability.md) | Same data model as P0; **after** user-facing health reduces risk of rushing operator auth and global listings. |
| **P3** | [`ci-remote-e2e-smoke-strategy.md`](./ci-remote-e2e-smoke-strategy.md) | Mostly **decision + docs** (and optional CI edits); can run **in parallel** with P0–P2 if bandwidth allows — ideally before or during heavy UI work to protect `main`. |
| **P4** | [`bdd-persona-coverage-wave-1.md`](./bdd-persona-coverage-wave-1.md) | Broad BDD coverage wave; natural **after** major surfaces (e.g. source health) stabilize, or incrementally alongside P1 if scenarios stay behavior-focused. |

**Source health slice** stays **contract → `/feeds` → operator** (P0 → P1 → P2).

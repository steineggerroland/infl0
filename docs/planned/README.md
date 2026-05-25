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
- When a package ships: move it to `../archive/` and drop it from the index
  below. The archive carries the full shipped scope; this README stays
  forward-looking.

## Index

| Package | Summary | Status |
|--------|--------|--------|
| [`persona-expectation-map-v1.md`](./persona-expectation-map-v1.md) | Capture persona needs and planned pending BDD expectations for roadmap v1 | Draft |
| [`integrator-ingest-observability-dashboard.md`](./integrator-ingest-observability-dashboard.md) | Add operator-protected ingest request observability for TopicKnowledgeCrawler integrators | Draft |
| [`bdd-persona-coverage-wave-2-existing-tests-to-screenplay.md`](./bdd-persona-coverage-wave-2-existing-tests-to-screenplay.md) | Finish migrating existing behavior-focused BDD steps toward reusable Screenplay Tasks and Questions | Done |
| [`bdd-persona-coverage-wave-3-privacy-and-power-users.md`](./bdd-persona-coverage-wave-3-privacy-and-power-users.md) | Fill remaining privacy, active-reader, and timeline-curator persona gaps | Draft |
| [`oblivia-recovery-email-verification.md`](./oblivia-recovery-email-verification.md) | Verified recovery email (settings OTP) and password recovery via SMTP; persona Oblivia | Draft |

*(Add a row when a new package markdown is created.)*

## Prioritized backlog (recommended working order)

Use this order when choosing what to implement next. **Revisit** after each
package ships or when dependencies change.

| Priority | Package | Rationale |
|:--------:|---------|-----------|
| **P1** | [`persona-expectation-map-v1.md`](./persona-expectation-map-v1.md) | Make needs and planned BDD expectations explicit before deciding the next implementation slice. |
| **P2** | [`integrator-ingest-observability-dashboard.md`](./integrator-ingest-observability-dashboard.md) | Converts the TKC ingest contract into operator/integrator observability without weakening existing E2E API tests. |
| **P3** | [`bdd-persona-coverage-wave-2-existing-tests-to-screenplay.md`](./bdd-persona-coverage-wave-2-existing-tests-to-screenplay.md) | Finish the remaining content-presentation migration around the Screenplay foundation. |
| **P4** | [`bdd-persona-coverage-wave-3-privacy-and-power-users.md`](./bdd-persona-coverage-wave-3-privacy-and-power-users.md) | Complete the remaining persona breadth once shared Tasks and Questions are reusable. |
| **P5** | [`oblivia-recovery-email-verification.md`](./oblivia-recovery-email-verification.md) | Closes unverified recovery gap; needs SMTP + OTP APIs; BDD via neonnormal.eu catch-all. |

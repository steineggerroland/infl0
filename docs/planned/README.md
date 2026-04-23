# Planned feature packages

This folder contains **concrete implementation packages**: bounded scope,
order, acceptance criteria — separate from the large idea pool in
[`../ROADMAP.md`](../ROADMAP.md).

## Convention

- **One file per package** (or per larger theme), e.g.
  `shortcuts-help.md`, `onboarding-welcome-timeline.md`.
- At the top: **goal**, **non-goals**, **dependencies**, optional **estimate /
  risk**.
- At the bottom: **user stories** or a checklist, **definition of done**, links to
  PRs/issues when available.
- New package: copy [`_template.md`](./_template.md), use `kebab-case.md` for
  the file name.

## Index

| Package | Summary | Status |
|--------|--------|--------|
| [`shortcuts-help.md`](./shortcuts-help.md) | Help copy + central shortcuts reference (incl. readability and app shortcuts) | Draft |
| [`onboarding-welcome-timeline.md`](./onboarding-welcome-timeline.md) | Welcome content via fixed cards (shortcuts, themes, sources, app behaviour); basis for E2E with sign-up + login | Draft |

*(Add a row when a new package markdown is created.)*

## Suggested order (non-binding)

1. Shortcuts / help (`shortcuts-help.md`) and, as needed, onboarding
   (`onboarding-welcome-timeline.md`) — few side effects, improves
   discoverability and testability.
2. Later: explicit “capture” (collection / knowledge) **without** an LLM, then
   larger product areas (knowledge menu, search, …) as separate packages (see
   `ROADMAP.md`).

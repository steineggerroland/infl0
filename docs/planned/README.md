# Planned feature packages

This folder contains **concrete implementation packages**: bounded scope,
order, acceptance criteria — separate from the large idea pool in
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

## Index

| Package | Summary | Status |
|--------|--------|--------|
| [`return-context-and-onboarding-completion.md`](./return-context-and-onboarding-completion.md) | Define stable return-to-context behavior and explicit onboarding completion model | Draft |
| [`bdd-persona-coverage-wave-1.md`](./bdd-persona-coverage-wave-1.md) | Add first BDD scenario wave for new-user, privacy-sensitive, and power-user personas | Draft |
| [`ci-remote-e2e-smoke-strategy.md`](./ci-remote-e2e-smoke-strategy.md) | Decide and document remote CI strategy for smoke E2E gates | Draft |

*(Add a row when a new package markdown is created.)*

## Suggested order (non-binding)

1. `return-context-and-onboarding-completion.md`
2. `bdd-persona-coverage-wave-1.md`
3. `ci-remote-e2e-smoke-strategy.md`
4. Next package: explicit “capture” (collection / knowledge) **without** an
   LLM, then larger product areas (knowledge menu, search, …) as separate
   packages (see `ROADMAP.md`).

## Recently archived

- [`../archive/26-04-30-onboarding-welcome-timeline.md`](../archive/26-04-30-onboarding-welcome-timeline.md)

# BDD test suite (operational)

This folder contains executable user-facing behavior specifications using Cucumber + Playwright.

## Scope and ownership

- Feature files in `tests/bdd/features` are the primary source of truth for user journey behavior.
- Shared, cross-feature actions/assertions live in `tests/bdd/steps/shared.steps.js`.
- Domain-specific behavior stays separated:
  - onboarding behavior in `tests/bdd/steps/onboarding.steps.js`
  - registration/login behavior in `tests/bdd/steps/auth.steps.js`
- Browser locale is forced to English in `tests/bdd/support/world.js` so scenario wording and assertions stay EN-consistent.

## Authoring rules

- Write scenarios from the user perspective, not from component internals.
- Prefer stable product-facing selectors and visible outcomes.
- Keep technical setup hidden inside step definitions and world helpers.
- When behavior is already covered by BDD, avoid duplicating the same feature logic in E2E specs.

## Run commands

- Production-like BDD run (build + server + scenarios): `npm run test:bdd`
- Local BDD run against a running app: `npm run test:bdd:local`

## Relationship to other test layers

- Unit/component tests protect fast domain and component-level contracts.
- E2E tests are smoke/setup oriented.
- BDD is the primary layer for end-user behavior.

See `docs/DEVELOPING.md` for the full layer strategy and `docs/TEST_COVERAGE_MATRIX.md` for feature coverage and gap prioritization.

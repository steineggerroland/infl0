# BDD test suite (operational)

This folder contains executable user-facing behavior specifications using Cucumber + Playwright.

## Scope and ownership

- Feature files in `features/**/*.feature` are the primary source of truth for user journey behavior.
- Shared, cross-feature actions/assertions live in `features/steps/shared.steps.js`.
- Domain-specific behavior stays separated:
  - onboarding behavior in `features/steps/onboarding.steps.js`
  - reader return-context behavior in `features/steps/reader.steps.js`
  - registration/login behavior in `features/steps/auth.steps.js`
- Browser locale is forced to English in `features/support/world.js` so scenario wording and assertions stay EN-consistent.

## Authoring rules

- Write scenarios from the user perspective, not from component internals.
- Prefer stable product-facing selectors and visible outcomes.
- Keep technical setup hidden inside step definitions and world helpers.
- Prefer API/UI setup so scenarios can eventually run against a deployed instance with HTTP only.
- Avoid direct database access in step definitions whenever the behavior can be set up or asserted through UI/API flows.
- When behavior is already covered by BDD, avoid duplicating the same feature logic in E2E specs.

## Test gaps

- Privacy-sensitive tracking journey: disabled/enabled tracking and visible explanation affordances.
- Power-user personalization journey: score/sort preference tuning and expectation framing.
- Returning-user onboarding completion: post-skip/post-complete behavior across sessions.
- Feed/source management: source add/remove and visible inflow consequences.

## Run commands

- Production-like BDD run (build + server + scenarios): `npm run test:bdd`
- Local BDD run against a running app: `npm run test:bdd:local`

## Relationship to other test layers

- Unit/component tests protect fast domain and component-level contracts.
- E2E tests are smoke/setup oriented.
- BDD is the primary layer for end-user behavior.

See `docs/DEVELOPING.md` for the full layer strategy.

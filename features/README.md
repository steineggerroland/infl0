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

Covered since the reader/read-state work: **`reader_return_context.feature`** (reader
start, resume/jump, calm URLs, read feedback, read without behaviour tracking, read
shortcut). Registration/login journeys stay in **`auth_registration_login.feature`**;
Daisy fieldset/alert markup there is an implementation detail unless we add negative
paths (e.g. invalid credentials → visible error).

Still sensible BDD candidates for recent product surface (see git range after
`6d5a4b9` on `main`):

- **Settings hub:** drawer/sidebar navigation and deep links (`/settings#…`,
  including `#display-*` and sorting sub-anchors); optional narrow-viewport “Sections”
  control. High user impact; not yet a dedicated feature file.
- **Feed/source management:** add/remove feed and visible outcome (listed here before;
  still no `features/*.feature` for `/feeds`).
- **Privacy-sensitive tracking journey:** disabled/enabled tracking and explanation
  affordances on `/settings` (copy + toggle), still uncovered at BDD layer.
- **Power-user personalization journey:** `/settings/personalization` score framing
  and expectation copy (still uncovered at BDD layer).
- **Returning-user onboarding completion:** post-skip / post-complete behavior across
  sessions where not already expressed in reader scenarios.
- **Help FAQ:** optional regression for expandable FAQ rows (Daisy `collapse` on
  `<details>`); lower priority than settings/feeds if component tests stay green.

## Run commands

- Production-like BDD run (build + server + scenarios): `npm run test:bdd`
- Local BDD run against a running app: `npm run test:bdd:local`

## Relationship to other test layers

- Unit/component tests protect fast domain and component-level contracts.
- E2E tests are smoke/setup oriented.
- BDD is the primary layer for end-user behavior.

See `docs/DEVELOPING.md` for the full layer strategy.

# BDD test suite (operational)

This folder contains executable user-facing behavior specifications using Cucumber + Playwright.

## Scope and ownership

- Feature files in `features/**/*.feature` are the primary source of truth for user journey behavior.
- Shared, cross-feature actions/assertions live in `features/steps/shared.steps.js`.
- Domain-specific behavior stays separated:
  - onboarding behavior in `features/steps/onboarding.steps.js`
  - reader return-context behavior in `features/steps/reader.steps.js`
  - registration/login behavior in `features/steps/auth.steps.js`
  - settings hub / tracking / personalization in `features/steps/settings.steps.js`
  - feeds (sources) in `features/steps/feeds.steps.js`
- Browser locale is forced to English in `features/support/world.js` so scenario wording and assertions stay EN-consistent.

## Authoring rules

- Write scenarios from the user perspective, not from component internals.
- Prefer stable product-facing selectors and visible outcomes.
- Keep technical setup hidden inside step definitions and world helpers.
- Prefer API/UI setup so scenarios can eventually run against a deployed instance with HTTP only.
- Avoid direct database access in step definitions whenever the behavior can be set up or asserted through UI/API flows.
- When behavior is already covered by BDD, avoid duplicating the same feature logic in E2E specs.

## Test gaps

Covered in BDD today:

- **`reader_return_context.feature`** — reader start, resume, URLs, read feedback,
  read without behaviour tracking, read shortcut.
- **`auth_registration_login.feature`** — register, sign-in, sign-out journeys.
- **`settings_hub_navigation.feature`** — `/settings` deep links and a hub sidebar
  jump (wide viewport); not yet the narrow **Sections** drawer control.
- **`settings_tracking_and_personalization.feature`** — `#tracking` affordance and
  one toggle flip; **`/settings/personalization`** title + algorithm snapshot heading.
- **`feeds_sources.feature`** — add a source from `/feeds`, list row, remove, empty
  state again.

Still sensible follow-ups:

- **Narrow viewport settings:** open **Sections** (`settingsNav.openSections`), pick
  a link, assert hash + visible block (mobile drawer).
- **Auth negative path:** invalid credentials → visible **`alert`** (optional).
- **Tracking copy:** assert intro/label strings remain visible after toggling (optional).
- **Personalization depth:** expand a timeline row, assert rank strip (optional).
- **Returning-user onboarding completion** across sessions (where not already in
  reader scenarios).
- **Help FAQ** expand/collapse regression (optional; component tests already exist).

## Run commands

- Production-like BDD run (build + server + scenarios): `npm run test:bdd`
- Local BDD run against a running app: `npm run test:bdd:local`

## Relationship to other test layers

- Unit/component tests protect fast domain and component-level contracts.
- E2E tests are smoke/setup oriented.
- BDD is the primary layer for end-user behavior.

See `docs/DEVELOPING.md` for the full layer strategy.

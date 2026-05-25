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
  - article/episode card presentation in `features/steps/content-presentation.steps.js`
  - home-screen install listing in `features/steps/pwa.steps.js`
- Browser locale is forced to English in `features/support/world.js` so scenario wording and assertions stay EN-consistent.

## Authoring rules

- Write scenarios from the user perspective, not from component internals.
- Prefer stable product-facing selectors and visible outcomes.
- Keep technical setup hidden inside step definitions and world helpers.
- **Assert user-visible behavior in the browser** (controls, labels, `aria-*`, stable `data-testid` hooks). Do not wait on or assert `/api/*` responses in step definitions unless there is no UI path.
- **Show-read preference:** use the timeline shortcut `r` when the reader is already interactive; on the reader-start screen (onboarding hidden) use the menu switch with `check()` / `uncheck()` on the native checkbox — not `click()` on the DaisyUI label (double-toggle risk).
- Avoid direct database access in step definitions whenever the behavior can be set up or asserted through UI flows.
- **Allowed non-UI setup** (documented in `features/support/crawler-fixtures.js` and step comments):
  - **TopicKnowledgeCrawler** ingest and source-status posts (external system; no infl0 UI).
  - **Reader scenario Background** (`my inflow contains reader articles`): `POST /api/feeds` plus hiding onboarding via `PATCH /api/me/ui-prefs` so the step stays within Cucumber’s step timeout; feeds UI add remains covered in `feeds_sources.feature`.
  - **Backdating `lastReaderSessionStartedAt`** for the “new articles since last session” scenario (no UI to set a past session anchor).
  - **`@http-only` PWA scenarios** that read `manifest.webmanifest` without a browser session.
- World `Before` hooks may still register accounts via API for speed; scenario steps should use the registration/login UI where the journey is under test.
- Tag `@http-only` when a scenario only checks server-delivered install metadata (no browser, no signed-in session).
- UI registration: reuse `When I open the registration page` + `When I register with a fresh valid account` from `auth.steps.js` (implementation in `features/support/auth-ui.js`). Start with `Given I start as a signed-out visitor` when the default `Before` session must be discarded.
- Browser scenarios use `serviceWorkers: 'block'` so the PWA service worker does not intercept `/api/*` during UI flows.
- When behavior is already covered by BDD, avoid duplicating the same feature logic in E2E specs.
- Persona journeys may use the Screenplay support layer in `features/support/screenplay`: feature files name an actor, steps delegate to Tasks, and Questions hold user-facing assertions. Keep concrete selectors in the existing screen/page objects.
- Tag planned but intentionally unfinished persona scenarios with `@pending`; default BDD commands exclude that tag.
- `@pending @persona` feature files capture planned persona expectations. Treat
  them as the red roadmap: remove `@pending` only when the behavior is ready to
  be implemented and verified.

## Test gaps

Covered in BDD today:

- **`reader_return_context.feature`** — reader start, resume, URLs, read feedback,
  read without behaviour tracking, read shortcut; return from Help with home
  navigation restores the reader without reader start (Help via floating menu);
  resume hidden when the
  stored anchor is read while “hide read articles” applies.
- **`auth_registration_login.feature`** — register, sign-in, sign-out journeys.
- **`settings_hub_navigation.feature`** — `/settings` deep links and a hub sidebar
  jump (wide viewport); not yet the narrow **Sections** drawer control.
- **`settings_tracking_and_personalization.feature`** — `#tracking` affordance and
  one toggle flip; **`/settings/personalization`** title + algorithm snapshot heading.
- **`feeds_sources.feature`** — add a source from `/feeds`, list heading + row, remove,
  empty state again; **no snapshot** row shows `no_snapshot` and expands to the
  “no status yet” copy (EN locale); **pause / resume** toggles `data-active` on the
  row; **`@crawler`** scenarios assert `data-source-health` from TopicKnowledgeCrawler
  (`needs_setup`) and user-facing expanded label for **`healthy`** (`All good`) when
  `NUXT_CRAWLER_API_KEY` is available (merged `.env.e2e`).
- **`operator_sources.feature`** — operator route protection (`403` for non-allowlisted
  user), operator access for seeded account, summary band visibility, attention-first
  row order, and filter behavior (blocked/quiet).
- **`content_presentation.feature`** — new user registers via shared auth steps;
  articles/episodes ingested per scenario (`Given I have an article/episode with …`);
  rich vs minimal card front/back, episode actions, collapsible chapters/shownotes,
  content/transcript tabs, and browser-level card shortcuts; negative checks for
  absent optional fields.
- **`add_infl0_to_home_screen.feature`** — install listing (name, EN/DE description,
  standalone app window, portrait/landscape), home-screen shortcuts to timeline /
  sources / settings, install icons, in-place updates, sign-in page ready for phone
  install (manifest link, viewport).
- **`new_user_first_reading_session.feature`** — Screenplay-style New User persona
  journey from UI registration through onboarding order, intro-card learning,
  onboarding return context, finishing onboarding from a later card, first
  source, crawler content delivery, deliberate reader start, and return-context
  recovery.

Still sensible follow-ups:

- **Narrow viewport settings:** open **Sections** (`settingsNav.openSections`), pick
  a link, assert hash + visible block (mobile drawer).
- **Auth negative path:** invalid credentials → visible **`alert`** (optional).
- **Tracking copy:** assert intro/label strings remain visible after toggling (optional).
- **Personalization depth:** expand a timeline row, assert rank strip (optional).
- **Help FAQ** expand/collapse regression (optional; component tests already exist).
- **Persona waves:** privacy-sensitive reader and power reader journeys.
- **Pending persona expectations:** privacy-sensitive reader, active returning
  reader, sensory customizer, curious explorer, timeline curator, operator, and
  integrator scenarios are captured as `@pending @persona` feature files.

## Run commands

- Production-like BDD run (build + server + scenarios): `npm run test:bdd`
- Local BDD run against a running app: `npm run test:bdd:local`

## Relationship to other test layers

- Unit/component tests protect fast domain and component-level contracts.
- E2E tests are smoke/setup oriented.
- BDD is the primary layer for end-user behavior.

See `docs/DEVELOPING.md` for the full layer strategy.

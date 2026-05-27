# BDD test suite (operational)

This folder contains executable user-facing behavior specifications using Cucumber + Playwright.

## Scope and ownership

- Feature files in `features/**/*.feature` are the primary source of truth for user journey behavior.
- Shared, cross-feature actions/assertions live in `features/steps/shared.steps.js`.
- Domain-specific behavior stays separated:
  - persona journeys in `features/steps/personas/*.steps.js`
  - shared auth UI primitives in `features/steps/auth.steps.js`
  - shared settings primitives in `features/steps/settings.steps.js`
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
  - **Reader scenario Background** (`my inflow contains reader articles`): `POST /api/feeds` plus hiding onboarding via `PATCH /api/me/ui-prefs` so the step stays within Cucumber’s step timeout; feeds UI add remains covered in `persona_timeline_curator_expectations.feature`.
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

- **`add_infl0_to_home_screen.feature`** — install listing (name, EN/DE description,
  standalone app window, portrait/landscape), home-screen shortcuts to timeline /
  sources / settings, install icons, in-place updates.
- **`new_user_first_reading_session.feature`** — Screenplay-style New User persona
  journey from UI registration through onboarding order, intro-card learning,
  onboarding return context, finishing onboarding from a later card, first
  source, crawler content delivery, deliberate reader start, and return-context
  recovery.
- **`persona_active_reader_expectations.feature`** — Screenplay-style active
  returning reader checks for sign-in/sign-out, account sign-in name visibility,
  article/episode card presentation, reader start, resume, URL calm, read
  feedback, read without behaviour tracking, episode dialog keyboard/tabs,
  mid-session reading controls, and returning from Help without losing context.
- **`persona_shorty_expectations.feature`** — Screenplay-style shortcut and card-
  surface checks: rich episode metadata (chapters, shownotes, details tabs), help
  reference (`/help#shortcuts-reference`), article and episode shortcuts,
  read/unread via `m`, and timeline show-read via `r`.
- **`persona_customizer_expectations.feature`** — Screenplay-style sensory
  customizer checks for saved display preferences, custom card-front colours,
  onboarding readability shortcuts for font size and typeface, and a
  low-stimulation reading setup before entering the reader.
- **`persona_privacy_expectations.feature`** — Screenplay-style privacy-sensitive
  reader checks for the reading behaviour tracking deep link, one deliberate
  tracking toggle change, the personalization explainer, and onboarding scoring
  transparency with control links, passive open without tracking, and
  personalization signal inspection after opting in.
- **`persona_explorer_expectations.feature`** — Screenplay-style curious explorer
  checks for deep onboarding exploration, settings deep links, wide-layout
  section navigation, and phone install affordances before sign-in.
- **`persona_timeline_curator_expectations.feature`** — Screenplay-style timeline
  curator checks for adding/removing sources, no-snapshot health, pause/resume,
  and `@crawler` health/status explanations when `NUXT_CRAWLER_API_KEY` is
  available; weighting and focused working sets remain captured as `@pending`.
- **`persona_operator_expectations.feature`** — Screenplay-style operator checks
  for source observability route protection, seeded operator access, summary
  visibility, attention-first row order, and blocked/quiet filtering.
- **`persona_oblivia_expectations.feature`** — Screenplay-style forgetful-reader
  checks for verified recovery email (settings OTP) and password recovery after
  sign-out; requires SMTP and mailbox OTP helpers (`@pending`, see
  `docs/planned/oblivia-recovery-email-verification.md`).

Still sensible follow-ups:

- **Narrow viewport settings:** open **Sections** (`settingsNav.openSections`), pick
  a link, assert hash + visible block (mobile drawer).
- **Auth negative path:** invalid credentials → visible **`alert`** (optional).
- **Tracking copy:** assert intro/label strings remain visible after toggling (optional).
- **Help FAQ** expand/collapse regression (optional; component tests already exist).
- **Integrator observability:** implement Ingo's pending dashboard scenarios
  once ingest request history is persisted and visible to operators.
- **Pending persona expectations:** timeline curator weighting / working sets,
  integrator observability, and Oblivia recovery email verification / password
  reset scenarios are captured as `@pending @persona` feature files.

## Run commands

- Production-like BDD run (build + server + scenarios): `npm run test:bdd`
- Local BDD run against a running app: `npm run test:bdd:local`

Both local BDD commands use the pretty formatter for readable behavior output.
Remote BDD keeps the compact progress formatter for CI logs.

## Relationship to other test layers

- Unit/component tests protect fast domain and component-level contracts.
- E2E tests are smoke/setup oriented.
- BDD is the primary layer for end-user behavior.

See `docs/DEVELOPING.md` for the full layer strategy.

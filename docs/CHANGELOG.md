# Changelog

Notable changes for **infl0** operators (self-hosters, integrators, future
contributors): **features**, **fixes**, and especially **breaking** behaviour
or configuration. Internal refactor-only work is omitted unless it affects
build, deploy, or extension points.

Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Release **versions** (e.g. `v0.3.0`) are assigned when we tag; until then,
new entries accrue under **Unreleased**.

## [Unreleased]

### Added

- **Username login:** registration and sign-in use a unique **username** (SRP
  identity). Optional **recovery email** is stored for future account recovery;
  it is not verified yet. Existing users are migrated with `username = lower(email)`.
  Settings show the sign-in name and recovery email (`#account`). Seed accounts use
  usernames `dev` and `operator`; operator allowlist is
  `NUXT_OPERATOR_USERNAMES`.
- **BDD Wave 2:** article and episode card presentation scenarios moved into
  `persona_active_reader_expectations.feature` (Robin). Account settings scenarios
  assert sign-in name and recovery email match registration.
- **BDD Wave 3 (partial):** Robin episode keyboard/tabs and mid-session readability;
  Shorty timeline `r` (show-read); Priya passive open and personalization signals;
  Mira low-stimulation before reading; Eli deep onboarding exploration; Sam
  source weighting and its effect on reader ranking. Sam focused working sets,
  Oblivia, and integrator scenarios remain `@pending`.
- **BDD persona Shorty:** keyboard shortcut scenarios and rich episode card
  surface drills (chapters, shownotes, details tabs) live in
  `persona_shorty_expectations.feature`; moved out of Robin's feature file.

- **Reader episode cards:** inflow can render podcast episodes with dedicated
  card UI, icon registry, browser playback affordance for playable audio,
  podcast/feed links, collapsible chapters and shownotes, and content/transcript
  detail tabs. Demo seeding now includes podcast episodes, with component and
  unit coverage for episode playback, card rendering, icon lookup, read-state
  handling, and inflow mapping.
- **TopicKnowledgeCrawler ingest contract:** `POST /api/crawler/ingest`
  accepts TKC article and podcast episode payloads from the checked-in
  `tests/fixtures/tkc-ingest/*.json` contract examples. Articles now persist
  `updated_at`; episodes persist podcast metadata, shownotes, chapters,
  transcripts, chapter/transcript fetch diagnostics, and `explicit` as a
  boolean. Unsupported section payloads are rejected for now and surfaced via
  `SourceStatus` with operator attention. New unit and Playwright E2E tests
  exercise `article.json`, `episode.json`, and `section.json` against the
  ingest flow.
- **Progressive Web App (PWA):** installable from Chrome (manifest, icons,
  service worker, EN/DE install text, home-screen shortcuts, update toast).
  Regenerate icons with `npm run pwa:icons`. Preview on port **3001**;
  `npm run dev` uses **127.0.0.1:3000**.
- **BDD:** `add_infl0_to_home_screen.feature` — PO-readable scenarios for
  install listing, shortcuts, icons/updates, and sign-in page install hints
  (`@http-only` for metadata-only checks).
- **BDD:** `content_presentation.feature` — PO-readable coverage for rich and
  minimal article / episode card presentation, including episode actions,
  optional sections, and details dialog content.
- **Remote E2E smoke gate:** Vercel deployments now expose their deployed URL
  to follow-up GitHub Actions jobs. Production/main deployments run a small
  Playwright smoke suite against the real app, while same-repository PR
  previews also run the full Playwright E2E suite and Cucumber BDD suite
  against the isolated Vercel + Neon preview instance. The regular authed
  Playwright project now registers a fresh account instead of mutating the
  seeded demo user.
- **BDD Screenplay persona foundation:** New User coverage now includes a
  named-actor Screenplay journey for onboarding order, intro-card learning,
  onboarding return context, finishing onboarding from a later card, and the
  first deliberate reading session after adding a source and receiving crawler
  content. Shared Screenplay Actor / Task / Question support and
  `OnboardingJourney` keep selector details out of persona steps.
- **BDD persona migration:** existing browser behavior for reader return
  context, read-state feedback, privacy/tracking controls, display preferences,
  onboarding readability, settings navigation, source curation, operator source
  observability, and phone install affordances now lives in named persona
  journeys (Robin, Priya, Mira, Eli, Sam, Oli). Planned gaps remain visible as
  `@pending` scenarios, while `content_presentation.feature` stays as the
  remaining classic content-card feature for a follow-up migration.

### Fixed

- **SRP login on serverless deploys:** short-lived SRP challenge state is now
  persisted in Postgres instead of process memory, so challenge/verify can
  succeed when Vercel routes the two requests to different runtime instances.
- **Episode card accessibility and HTML safety:** episode details now open as a
  labelled dialog with screen-reader-friendly tabs (`aria-controls`,
  tabpanels, roving `tabindex`, arrow/Home/End keyboard navigation), labelled
  close control, and focus return to the triggering card action. Episode
  Markdown rendering now goes through a named `SafeMarkdown` /
  `renderSafeMarkdown()` sanitizer boundary with tests for allowed Markdown and
  stripped unsafe HTML. The EpisodeCard / Infl0Icon lint warnings are resolved.
- **Article reader modal accessibility:** `ArticleView` is now `ArticleCard` to
  match its reader-card role. Its full-text dialog uses the shared
  `SafeMarkdown` sanitizer boundary, has a visible accessible title, labelled
  close control, and returns focus to the triggering card action when closed.
- **PWA / SSR:** disable Workbox `navigateFallback` so navigations are not
  rewritten to `/` (avoids broken asset loads and `application/json` MIME
  errors when a stale service worker or wrong port is used).
- **BDD:** block service workers in browser scenarios; add-source steps assert
  visible list outcome instead of flaky `waitForResponse` on `POST /api/feeds`.
- **BDD maintainability:** replace the broad `ui-helpers` module with named
  screen objects for sources, reader timeline, settings, and user menu; align
  new scenarios on first-person wording and move low-level card assertions out
  of the feature text.
- **BDD browser coverage for reader card shortcuts:** `content_presentation.feature`
  now drives article and episode cards through the browser keyboard path for
  flip/close (`E`, `Escape`), details/fulltext dialog (`Q`), read state (`M`),
  font size (`+`, `=`, `-`, `0`), and font family (`Shift+K` / `Shift+L`).
- **Onboarding completion:** the onboarding finish action is now available on
  every onboarding card, not just the intro card, so readers can leave the
  guided flow once they have enough context.
- **BDD output:** local production-like and already-running-app Cucumber runs
  use the pretty formatter with quiet dotenv loading; remote BDD keeps compact
  progress output for CI logs.

## [0.5.0] — 2026-05-15

Operator observability (status board + access allowlist), source-health UX
(triage-first ordering, pause/resume, inflow share, explicit per-source
weighting), reader resume hardening, and a stack-wide dependency / GitHub
Actions refresh. **Database:** run **`npm run db:migrate:deploy`** after deploy
to apply the two new Prisma migrations introduced since `v0.4.0`
(**`20260510120000_source_statuses`**, **`20260510130000_user_feed_preference`**).
**Env:** new **`NUXT_OPERATOR_EMAILS`** (comma-separated allowlist) is required
to grant any account access to **`/operator/sources`** and
**`GET /api/operator/source-statuses`**; an empty value denies every request
with `403`.

### Added

- **Vercel demo seeding for both demo accounts.** The `Deploy Vercel`
  workflow now seeds users + source-status matrix from `.env.e2e`
  (`prisma db seed`) before adding article fixtures (`npm run devData`),
  and sets `NUXT_OPERATOR_EMAILS=operator@localhost` (overridable via
  the `NUXT_OPERATOR_EMAILS` repo secret) on the deployed app. Result:
  every Vercel deployment offers **`dev@localhost` / `dev`**
  (regular user, with 2 sample feeds + 3 articles + the source-health
  matrix) and **`operator@localhost` / `dev`** (operator, with
  `/operator/sources` reachable) out of the box. The preview PR
  comment lists both credential sets, and the main `README.md` adds
  the operator account next to the existing demo user. Previously the
  operator account did not exist on Vercel.

- **Operator status board (`/operator/sources`):** protected, technical
  overview across every known `crawlKey` — not only the operator's own
  subscriptions. The page shows a compact summary band (total sources,
  needing attention, failing, degraded, recent candidates / processed /
  fetch errors / LLM failures) and a table sorted **attention-first**,
  then by health severity (`blocked` → `failing` → `degraded` →
  `needs_setup` → `quiet` → `pending` → `paused` → `healthy`), then by
  `crawlKey`. Columns include source / crawl key, type, health, attention
  reason, last crawl status, consecutive errors, candidates / processed /
  skipped, fetch errors, LLM failures, next allowed crawl, and crawler
  hints (HTTP status, `Retry-After`, `Cache-Control`). Filters narrow
  to *Attention only*, *Failing / degraded*, *Needs setup*, *Blocked*,
  or *Quiet*. Backed by **`GET /api/operator/source-statuses`**
  (`?filter=<key>`), guarded by `requireOperatorUser`. Both the page and
  the API enforce an email allowlist via the new env var
  **`NUXT_OPERATOR_EMAILS`** (comma-separated, lower-cased on read; an
  empty or typo-only value denies every request with `403`). Invalid
  entries (missing `@…`) are dropped at parse time and surfaced; the
  Nitro plugin `server/plugins/operator-access-boot-log.ts` prints the
  parsed allowlist size (and any invalid entries) once at server start
  so silent misconfigurations no longer surface only as a stray `403`.
  i18n copy lives under `operatorSources.*` (DE / EN). Tests:
  `tests/unit/operator-access.test.ts`,
  `tests/unit/api-operator-source-statuses.test.ts`, Playwright project
  `chromium-operator` with `tests/e2e/operator-auth.setup.ts` +
  `tests/e2e/authed/operator-sources.spec.ts`, BDD
  `features/operator_sources.feature`. See [`OPERATOR.md`](./OPERATOR.md)
  for the access model and runbook.

- **Source health UX on `/feeds`:** triage-first ordering (`failing` → `blocked` →
  `degraded` → `needs_setup` → `pending` → `quiet` → `paused` → `healthy`), an
  attention banner above the list when at least one source needs action, a
  left accent stripe per row, and per-status **what / action** copy
  explaining the problem and a next step in plain language (German +
  English). The expanded health summary itself was reworked into a calm
  five-block layout — DaisyUI status dot inline with a bold label,
  one merged help sentence (`what` + `action`), two muted timestamps for
  *Letzter Abruf* / *Nächster Abruf*, an optional last-error box, and the
  operator-attention banner — using only `text-sm` body / `text-xs` muted
  secondary, instead of the earlier mix of three sizes and operator-grade
  fields. Pipeline state, run status, last successful crawl, processed /
  fetch-error counts, the consecutive-error streak, and the inner *„Mehr
  Infos"* disclosure were removed from the user view (they're operator
  telemetry, not reader-relevant). The `needs_setup` status now reads
  *„Wird vorbereitet" / „Getting ready"* with helper copy that makes
  explicit that the *system* is doing the preparation, not the user. Each row is now a
  **compact, collapsible** `<details>`: title (or URL), URL underneath, and
  the Pause / Remove actions stay on one truncated line; the full health,
  inflow share, and weighting controls expand on click. On phone widths the
  status is conveyed entirely by the **left accent stripe** (no separate
  summary dot), the `<summary>` drops to `px-0`, and panel containers go
  from `p-6` to `p-3 sm:p-6` so titles and URLs are no longer aggressively
  truncated. While collapsed the row keeps its single-line summary; once
  expanded the title and URL switch to `whitespace-normal break-words`
  via `group-open:` so even long URLs are fully readable. Because the
  `<summary>` is always the disclosure toggle (so plain text inside it
  can never be a real link), the body now exposes **„Quelle öffnen"**
  (`<a target="_blank" rel="noopener">`) and **„URL kopieren"** action
  buttons that sit outside the toggle and don't fight the disclosure. The seed user (`dev@localhost`) now ships with friendlier
  titles per status (e.g. *„Beispielquelle · läuft sauber"*) instead of
  `Seed · pending`, and the `paused` example is genuinely paused
  (`active=false`).

- **Pause / Resume per source:** new **`PATCH /api/feeds/:id`** with
  `{ active: boolean }` flips a subscription between active and paused while
  keeping its weighting and read history. Paused rows stay visible on `/feeds`
  with a Resume action; the inflow / crawler queries continue to filter on
  `active = true`.

- **Inflow share + read history per source:** new **`GET /api/me/feed-stats`**
  returns one row per active *and* paused subscription with
  `inflowCount` / `readCount` / `unreadCount` / `sharePercent` / `lastReadAt`
  (counts aggregated in PostgreSQL per `crawl_key`, not by loading every timeline
  row in Node). `/feeds` shows compact figures via DaisyUI tooltips so users can spot
  sources that dominate or are under-represented.

- **`InfoPopover` mobile fallback:** the popover anchors to its trigger
  and clamps width to the viewport, but with a `~20 rem` panel and a
  trigger near the centre of a 414 px screen there is no side that has
  enough room — the panel kept overflowing. The `FeedSourceWeighting`
  hint now renders as a muted inline paragraph below the slider on
  phone widths (`md:hidden`) and keeps the compact desktop popover
  on `md` and up (`hidden md:inline-flex`). Same content, same a11y
  contract, delivered in the form factor each viewport actually has
  room for. The popover itself also picks `start`-vs-`end` alignment
  automatically when it opens (regression tests in
  `tests/component/InfoPopover.test.ts`), and the `/feeds` row drops
  the `overflow-hidden` clip that previously hid the panel inside the
  source card; the rounded `<li>` border still shows clean corners
  because the inner `<details>` body stays within the row's bounds.

- **Explicit per-source weighting (steers the inflow):** new column
  **`UserFeed.userPreferenceWeight`** (`-1 … +1`, `0.25` steps) and
  **`PATCH /api/feeds/:id/preference`** which validates the value, stores it,
  and immediately re-runs **`recomputeTimelineScoresForUser` scoped to that feed’s
  `crawlKey`** (only articles from that source change rank). The weight is added
  to `rank_score` as `pref × SOURCE_PREFERENCE_BONUS` (`0.5`) so a `+1` rating
  bumps articles from that source by **0.5** and `-1` subtracts the same — a
  noticeable nudge that doesn't drown out freshness or content signals. The
  control on `/feeds` is a `−1 … +1` range with a *Less / Just right / More*
  scale, optimistic update + rollback, and the explanation tucked behind
  an `InfoPopover` (*„i"*) next to the legend rather than as always-on
  body copy. Migration: **`20260510130000_user_feed_preference`**
  (additive).

- **Source health API (crawler + app):** Prisma **`SourceStatus`** / **`source_statuses`**
  (latest snapshot per **`crawlKey`**). **`POST /api/crawler/source-status`** upserts with the
  same **`NUXT_CRAWLER_API_KEY`** as ingest (camelCase or snake_case body).
  **`GET /api/source-statuses`** returns active feeds for the signed-in user with optional
  **`latest`** health payload. Migration **`20260510120000_source_statuses`**.
  Playwright **`tests/e2e/authed/source-statuses.spec.ts`** covers create feed → crawler upsert
  → session **`GET /api/source-statuses`** (requires migrated DB + **`.env.e2e`** crawler key).

- **Reader session persists across Help / Settings / Feeds:** leaving `/` for those
  routes while reading stores a same-tab flag so returning to `/` skips the reader
  start screen and restores the last inflow anchor when possible (full reload
  unchanged).

- **Resume / restore without bogus fallback:** “Jump to last article” is hidden when
  that anchor is filtered out as read while “hide read” is on; resume and restore
  no longer scroll to an unrelated article via offset fallback (`GET
  /api/me/articles/:articleId/resume-eligibility`).

- **Dependabot** version updates on a **weekly** schedule for **npm** and **GitHub
  Actions** (`.github/dependabot.yml`), so dependency and workflow-action bumps land as
  reviewable PRs.

### Changed

- **Performance (review follow-up):** `PATCH /api/feeds/:id/preference` runs
  **`recomputeTimelineScoresForUser` only for that subscription’s `crawlKey`**
  (the preference bonus affects only articles from that source, not the whole
  timeline). **`GET /api/me/feed-stats`** uses one grouped SQL query over
  `user_timeline_items` × `articles` instead of loading every row into Node.

- **Why at the top?** (`/settings/personalization`): the per-source preference
  from **Sources** (« How much from this source? ») is now a **dedicated factor
  row** in the ranking table (always shown; strength uses the same 0–1 scale
  as other factors via \((pref+1)/2\); importance shows an em dash because
  there is no slider weight). The recalculated total now **includes** that
  bonus so it lines up with the saved score. Links to **`/feeds`** sit under the
  algorithm explainer and under every expanded article’s factor table. **Adjust
  sorting** on `/settings` gains a Sources link + copy that global sliders and
  per-feed weighting stack. Help FAQ **howRanking** (DE/EN) explains both
  controls and where to change per-source weight.

- **BDD (Cucumber) reliability:** default step timeout raised to **60 s**, the
  “add source” step allows **120 s** and longer inner waits for **`POST /api/feeds`**
  so the runner no longer aborts before Playwright finishes (cold API/DB).
  **`features/feeds_sources.feature`** adds scenarios for no-snapshot health,
  pause/resume, list heading, and (with **`@crawler`**) expanded healthy label;
  **`docs/DEVELOPING.md`** documents **`npx playwright install chromium`** for
  **`test:bdd`** because Cucumber launches Chromium the same way as E2E.

- **`POST /api/crawler/source-status`:** the upsert **update** path is a **partial merge**
  — only keys present in the JSON body are written; omitted keys keep their stored values
  (explicit **`null`** still clears nullable scalars / JSON where sent). Matches safe
  delta payloads from n8n or the crawler.

- **Dependencies / lockfile:** ran **`npm update`** within existing semver ranges,
  refreshed **`package-lock.json`**, merged Dependabot npm bumps where applicable
  (including **audit-driven fixes**), and added an **`overrides`** pin for
  **`@hono/node-server`** so the transitive version stays on a known-good release.

- **Dependency bumps for the release** (combined Dependabot batch, see PR #31,
  closes #22–#30): **`nuxt`** 4.4.4 → 4.4.5, **`vue-router`** 5.0.6 → 5.0.7,
  **`dompurify`** 3.4.2 → 3.4.3 (runtime); **`@playwright/test`** 1.59.1 → 1.60.0,
  **`vitest`** 4.1.5 → 4.1.6, **`vue-tsc`** 3.2.8 → 3.2.9, **`@types/node`** 25.6.2
  → 25.8.0, **`tsx`** 4.21.0 → 4.22.0 (dev); transitive **`devalue`** 5.8.0 → 5.8.1
  via **`@nuxtjs/i18n`** and **`nuxt`**. All patch / minor; verified with `lint`,
  `vitest run` (447 / 447), `nuxi typecheck`, and a full production build.

- **Toolchain majors:** **TypeScript 6**, **`marked` v18**, **`@types/node` v25**, and
  **`dotenv-cli` v11**. **`marked` v18** trims trailing blank lines in block tokens,
  which can slightly change rendered Markdown HTML vs older releases; article reader
  sanitisation (`ArticleCard.vue`) is unchanged otherwise.

- **Vercel deploy workflow** skips jobs when the actor is **`dependabot[bot]`**, so
  routine dependency PRs do not trigger preview deployments.

- **GitHub Actions:** **`actions/checkout`** and **`actions/setup-node`** bumped to
  **v6** (CI, release, Vercel deploy); **`actions/github-script`** to **v9** (PR preview
  comments); **`softprops/action-gh-release`** to **v3** (tag releases).

- **Settings display preferences are easier to scan.** The `/settings`
  **Display** section now uses separate panels for light/dark, colour palette,
  each reading surface, and motion instead of one large mixed panel. Shared
  settings group styles keep `fieldset`/`legend` and `h3` sections visually
  aligned while preserving accessible form semantics. New Cucumber coverage
  verifies that display choices, typeface/size, motion, and custom colours stay
  saved after reload (`features/settings_display_preferences.feature`).

### Fixed

- **BDD (Cucumber):** reader Help navigation uses the teleported header dropdown
  (`features/steps/reader.steps.js`); add-source on `/feeds` uses stable field
  selectors, waits for **`POST /api/feeds`**, and reports failed saves explicitly
  (`features/steps/feeds.steps.js`).

- **Settings hub / app chrome:** the burger menu control keeps a **square** tap target;
  on narrow viewports, **settings** section actions stay clear of the menu overlay
  (`fix(menu)`, `fix(settings)`).

- **GitHub Actions security hygiene:** **`.github/workflows/ci.yml`** declares explicit
  **`permissions: contents: read`** for the default **`GITHUB_TOKEN`**, addressing
  CodeQL **`actions/missing-workflow-permissions`** (least-privilege token scope for CI).

## [0.4.0] — 2026-05-02

Reader-first inflow: a **deliberate reader start** (with resume), **timeline read
state** decoupled from behaviour tracking, **polymorphic onboarding** cards on
**`/api/inflow`**, and a **DaisyUI** consistency pass (settings hub drawer, feeds,
auth, help, footer, chrome). **Cucumber** now covers reader return-context, settings
hub navigation, tracking/personalization entry points, and feeds add/remove.
**Database:** no new Prisma migrations versus `v0.3.0` — run **`npm run db:migrate:deploy`**
after deploy anyway (idempotent).

### Breaking

- **`GET /api/timeline` is deprecated** and forwards to **`GET /api/inflow`** for one
  release; the alias will be removed in a later release. The JSON body is **no longer**
  a bare **`Article[]`**: responses use
  **`{ items: Array<{ type: 'article' | 'onboarding', … }>, hasMore, stats }`**.
  Migrate scripts and integrations to **`/api/inflow`**, treat items as a discriminated
  union, and filter **`type === 'article'`** when you only need article rows.

### Added

- **Cucumber coverage** for `/settings` hub deep links and a sidebar jump, reading-behaviour
  (`#tracking`) toggle flip, `/settings/personalization` snapshot headings, and `/feeds`
  add/remove (`features/settings_hub_navigation.feature`,
  `features/settings_tracking_and_personalization.feature`, `features/feeds_sources.feature`).

- **Deliberate reader start with resume option.** Once onboarding is
  hidden, opening `/` shows a quiet reader start screen instead of
  rendering article cards immediately. This prevents passive visits from
  starting dwell/read tracking. Users can choose **Start reading** to
  begin at the current first inflow article or **Jump to last article**
  to use the stored return context. `User.uiPrefs` now stores
  `lastReaderSessionStartedAt`, and `/api/inflow` reports
  `stats.newSinceLastReaderSession` for the start screen. The internal
  `/inflow/article/:id` and `/inflow/onboarding/:topic` URLs keep the
  browser location aligned with the current card, but they are not yet a
  supported sharing/bookmarking feature.

- **Reader return-context behavior specs.** New Cucumber scenarios cover
  onboarding bypass, passive opening without read tracking, fresh reader
  start, explicit resume to the stored article, missing resume context,
  URL calmness before start, new-article count, visible read-state
  feedback, marking read **without** behaviour tracking enabled, and
  manual unread via the read-state shortcut.

- **Separate timeline read marking from behaviour tracking.** `PATCH /api/me/articles/:articleId/read-state`
  toggles `read_at` on the signed-in user's timeline row. Focused articles
  can auto-mark **read** after ~2 s visible in the interactive reader,
  independently of engagement opt-in; `POST /api/me/article-engagement`
  still records dwell only when behaviour tracking is on and **does not**
  set read state.

- **Onboarding cards on a polymorphic inflow.** A new account lands on
  four prefabricated welcome cards (`intro`, `sources`, `scoring`,
  `themes`) that introduce navigation, where cards come from, what
  the score does, and where to tune theme / fonts / motion. The cards
  sit at the top of the inflow and are produced server-side from a
  static catalog (`utils/onboarding-cards.ts`); copy lives under
  `onboarding.*` in DE and EN. The `intro` card carries device-specific
  copy (keyboard navigation on desktop, button-driven flip on mobile)
  selected client-side via `matchMedia('(pointer: coarse)')`, with a
  DaisyUI skeleton placeholder shown until the query resolves so the
  wrong copy never flickers in. A *Skip introduction* button on
  `intro` and a matching toggle in `/settings` (Welcome cards section)
  share state through `User.uiPrefs.onboardingHidden`. Drift between
  catalog, i18n, and CTA hrefs is pinned by
  `tests/unit/onboarding-cards.test.ts`.

- **`GET /api/inflow` with discriminated card types.** The inflow
  endpoint now returns `{ items: Array<{ type: 'article' | 'onboarding', ... }>, hasMore, stats }`.
  `Article` rows keep the shape `ArticleCard` already consumes;
  `onboarding` rows are locale-free structural data (`topic`,
  `ordinal`, optional `cta`, `hasDeviceVariants`). Onboarding cards
  do not participate in `R` (show-read), engagement-tracking
  (dwell), or rank scoring — those mechanisms stay exclusive to
  article cards. `stats.total` / `stats.unread` continue to count
  article rows only.

- **`chromium-onboarding` Playwright project.** A new project alongside
  `chromium` and `chromium-authed` registers a fresh
  `regression-test-<unique>@neurospicy.icu` account per worker via the
  existing SRP register handler and asserts the four onboarding cards
  on `/`. Production-shaped path (no `devData` dependency) for E2E
  follow-ups now tracked in planned package docs under
  [`docs/planned/README.md`](./planned/README.md). The
  legacy `chromium-authed` project keeps logging `dev@localhost` in
  for specs that need the deterministic seeded data.

- **BDD suite aligned with Cucumber defaults.** Behavior features and
  glue now live under `features/**/*.feature` and `features/**/*.js`
  (including shared/auth/onboarding steps and world setup), replacing
  the previous `tests/bdd/**` layout. Cucumber scripts now run with
  quoted globs so step discovery is stable in shell and CI contexts.

- **Central keyboard-shortcut reference on `/help`.** A new
  `#shortcuts-reference` section lists every app shortcut in three
  groups (timeline, reading an article, comfort & readability), each row
  showing its key combo as `<kbd>` tokens plus a plain-language
  description. Sourced from a single catalog in code
  (`utils/app-shortcuts.ts`) so the visible list cannot drift out of
  sync with the actual `defineShortcuts` call sites; copy lives under
  `help.shortcutsReference.*` in DE and EN. The existing
  `help.items.shortcuts` FAQ entry was rewritten to point at the new
  reference.

- **Drift guard for the shortcut catalog.** A new Vitest spec
  (`tests/unit/shortcuts-coverage.test.ts`) scans every
  `defineShortcuts({...})` call in `pages/`, `components/`, and
  `composables/` via `import.meta.glob` and asserts that every
  registered key is either listed in `SHORTCUT_GROUPS`
  (`utils/app-shortcuts.ts`) or on an explicit
  `KNOWN_UNDOCUMENTED_KEYS` allow-list with a non-empty reason. The
  inverse direction is checked too: dead rows / typos in the catalog
  fail the test loudly. Adding a shortcut without documenting it can
  no longer "rutsch durch" review.

### Changed

- **Onboarding E2E narrowed to smoke-level behavior.** The onboarding
  Playwright spec now validates timeline load and onboarding render
  presence only; user-facing flow assertions moved to BDD scenarios.

- **Auth BDD logout flow hardened.** Logout steps now open the user menu
  explicitly before clicking the action, support localized button labels
  (`Log out` / `Abmelden`), and URL assertions accept optional query/hash
  suffixes (e.g. `/login?redirect=/`) for stable return-navigation checks.

- **Appearance presets emit DaisyUI semantic colours.** Derived theme CSS now
  includes `--color-base-*`, `--color-primary`, `--color-error`, etc., mapped
  from existing infl0 chrome and panel accents so DaisyUI components (`menu`,
  `dropdown`, `kbd`, …) follow the selected preset.

- **User menu chrome** uses DaisyUI `dropdown`, `menu`, and `swap` primitives;
  the opener `aria-label` reflects whether the menu is open or closed (`menu.close` /
  `menu.open`).

- **Help FAQ details (`/help`).** Long FAQ answers expand with DaisyUI
  **`collapse`** on native **`<details>` / `<summary>`** so browser find-in-page
  still discovers the copy ([Collapse with details](https://daisyui.com/components/collapse/#-collapse-using-details-and-summary-tag)).
  Chevron via **`collapse-arrow`**. Stable test hooks `help-faq-details-<itemId>`.

- **Timeline empty and info surfaces (`/`).** Onboarding-empty, preparing, reader-start,
  and all-read-empty copy use DaisyUI **`alert`** with **`alert-soft`**: informational
  states **`alert-info`**, “everything read” **`alert-warning`**, with **`role="status"`**
  (preparing also **`aria-live="polite"`**) and stable **`data-testid`** hooks for tests.

- **Feeds empty list.** Replaced the plain bordered bar with **`alert alert-info alert-soft`**
  ([Alert](https://daisyui.com/components/alert/)), `data-testid="feeds-empty-alert"`.

- **Auth entry forms (`/login`, `/register`).** DaisyUI **`fieldset`** (screen-reader legend)
  + **`label` / `label-text`** for each control; inline errors use **`alert alert-error`**
  ([Fieldset](https://daisyui.com/components/fieldset/)). Stable hooks `login-error` /
  `register-error`.

- **Personalization metrics (`/settings/personalization`).** Algorithm snapshot
  (prior α/β + blend coefficients) and the per-card **stored / live / delta** rank strip
  use DaisyUI **`stats`** / **`stat`** ([Stat](https://daisyui.com/components/stat/)) with
  left-aligned headings and monospace values; blend text wraps with **`!whitespace-normal`**
  instead of Daisy’s default nowrap.

- **Feeds / sources (`/feeds`).** Add-source form uses DaisyUI **`fieldset`** with
  **`fieldset-legend`**, stacked **`label` / `label-text`** pairs ([Fieldset](https://daisyui.com/components/fieldset/));
  submission errors use **`alert alert-error`**. Saved feeds render as DaisyUI **`list`**
  rows with **`list-row`** and **`list-col-grow`** for title/URL metadata and actions
  on the trailing column ([List](https://daisyui.com/components/list/)); empty state
  is a compact **`alert`**.

- **DaisyUI polish & Settings hub.** Settings **`drawer`** / **`menu`** with nested
  **`#display-*`** anchors and scroll-spy, compact hub **`menu`** row spacing, Daisy
  **`footer`** / **`link`** for **`AppFooterShortcuts`**, final sort-group copy (DE/EN).

### Fixed

- **Help shortcut `<kbd>` appearance.** Shortcut keys in `#shortcuts-reference`
  use DaisyUI `kbd` styling with a light-theme contrast tweak so keys stay readable
  on the help canvas.

### Documentation

- **Closed package** [`docs/archive/26-05-02-daisyui-polish-settings-navigation.md`](./archive/26-05-02-daisyui-polish-settings-navigation.md)
  (was `docs/planned/daisyui-polish-and-settings-navigation.md`).

- **Closed package** [`docs/archive/26-04-27-shortcuts-help.md`](./archive/26-04-27-shortcuts-help.md)
  (was [`docs/planned/shortcuts-help.md`](./planned/README.md)) with the
  shipped scope, deviations, and follow-ups.

- **Closed and archived onboarding package** to
  [`docs/archive/26-04-30-onboarding-welcome-timeline.md`](./archive/26-04-30-onboarding-welcome-timeline.md),
  with cross-doc links updated from planned → archive references.

- **Added test strategy and coverage planning docs**:
  - [`docs/planned/return-context-and-onboarding-completion.md`](./planned/return-context-and-onboarding-completion.md)
  - [`docs/planned/bdd-persona-coverage-wave-1.md`](./planned/bdd-persona-coverage-wave-1.md)
  - [`docs/planned/ci-remote-e2e-smoke-strategy.md`](./planned/ci-remote-e2e-smoke-strategy.md)

- **`package-lock.json`:** keep lockfile churn predictable by running **`npm ci` /
  `npm install` only with the Node version pinned in `.nvmrc`** (repo helper:
  `./scripts/with-nvm.sh`). A mismatched npm version can silently rewrite optional
  dependency metadata (e.g. `libc` qualifiers) across the tree.

## [0.3.0] — 2026-04-27

Major stack upgrade and production hardening release: Nuxt/Prisma/Tailwind and
tooling were upgraded, install/deploy paths were updated, and several
production, Docker, reader, WAF, and CI fixes landed after `v0.2.0`.

### Fixed

- **GitHub Actions CI workflow:** quoted the install step name containing `:`
  so `.github/workflows/ci.yml` parses as valid YAML again.
- **Postinstall order:** run `nuxt prepare` before `prisma generate` so
  `./.nuxt/tsconfig.json` exists when Prisma CLI loads TS config in CI.
- **Article `Q` shortcut:** With no in-app reader body (`rawMarkdown`), pressing **`Q`** no longer leaves the global modal stack stuck (background shortcuts muted until reload).
- **Docker / `npm ci --omit=dev`:** **`dotenv`** is a **runtime** dependency again.  
  `prisma.config.ts` imports **`dotenv/config`**; `postinstall` runs **`prisma generate`**, which loads that config. With `dotenv` only under `devDependencies`, production installs failed to resolve the module.
- **Production Postgres “too many clients”:** the lazy **`prisma`** singleton was only stored on **`globalThis`** when **`NODE_ENV !== 'production'`**. In production, **every** access to `prisma.*` created a **new** **`PrismaClient`** and **`pg.Pool`**. The client is now always cached on **`globalThis`** (one pool per Nitro worker).

### Breaking

Stack upgrade (**Nuxt 4**, **Prisma 7**, **Tailwind 4**, **daisyUI 5**, etc.).  
For a normal Postgres install, **pull → install → migrate → run** is enough.  
You do **not** need to run `postinstall` by itself after **`npm ci`** or **`npm install`** — npm runs it automatically.

#### Local dev

1. **Node** — Use the version in **`.nvmrc`** (see [README](../README.md)).
2. **`DATABASE_URL`** — Use a normal **TCP** Postgres URL, e.g.  
   `postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public`  
   (adjust user, password, host, db name). If auth fails after upgrade, double-check the URL and that Postgres accepts connections from your machine.
3. From the repo root:

   ```bash
   nvm use                    # or match .nvmrc another way
   npm ci                     # or: npm install — runs nuxt prepare + prisma generate
   npm run db:migrate:deploy  # applies migrations + prisma generate
   npm run dev
   ```

   Optional sanity check (same as CI after install): **`npm run verify`** (lint + tests + typecheck).

#### Docker (this repo’s `Dockerfile`)

1. Set **`DATABASE_URL`** at **runtime** (same TCP `postgresql://…` shape as above).
2. **Rebuild** the image from this revision (build context must include **`prisma/`** and **`prisma.config.ts`** — the Dockerfile expects them).
3. **Start** the container: the default **`CMD`** runs **`npx prisma migrate deploy`** then **`node .output/server/index.mjs`**. No extra migrate step if you use that entrypoint unchanged.

If you use **Compose** or another image, mirror the same idea: install from lockfile, generate Prisma client, ship **`prisma.config.ts`**, run **`migrate deploy`** before or on app start, with **`DATABASE_URL`** set.

#### Details (only if something is non-standard)

- **Prisma 7:** DB URL for the CLI lives in **`prisma.config.ts`** at the repo root; the client is generated under **`generated/prisma/`** (gitignored, recreated by install / **`prisma generate`**). **`npm run db:migrate:deploy`** (and other `db:*` scripts) already append **`prisma generate`** where needed.
- **Direct Postgres only** in this tree: **`DATABASE_URL`** must not be a Prisma Accelerate-only URL (`prisma://` / `prisma+postgres://`) unless you add a separate Accelerate client path yourself.
- **Seed:** migrations no longer auto-seed; run **`npx prisma db seed`** when you still want seed data.
- **SSL:** stricter TLS is possible with **node-pg**; fix CA / connection options if a hoster used to “work anyway”.
- **Forked UI/CSS:** if you override Tailwind or daisyUI heavily, see [Tailwind v4 upgrade](https://tailwindcss.com/docs/upgrade-guide) and [daisyUI + Nuxt](https://daisyui.com/docs/install/nuxt/).

### Changed

- **Article reader modal:** Opens only when the article has **`rawMarkdown`** from the database (ingested **`content_md`**). File-based fallback via **`@nuxt/content`** was removed with the module.
- **`dotenv`** **16 → 17** (runtime; used by **`prisma.config.ts`** / `import 'dotenv/config'`). No app code changes required for our usage.
- **Framework / tooling:** **Nuxt 4**, **Vue 3.5.x**, **Vue Router 5**, **Tailwind CSS 4** (via **`@tailwindcss/vite`**), **daisyUI 5**, **Prisma ORM 7** (Rust-free client + **pg** adapter), **Vitest 4**, **ESLint 10**, **marked** 15.x; **`@nuxtjs/i18n`** remains on a **latest** major compatible with Nuxt 4. **`@nuxt/content`** was removed (articles load from Postgres only).
- **Vue + Vite (dev):** **`vue`** and **`@vitejs/plugin-vue`** pinned to current patch minors for Vitest component tests.

### Documentation

- **Updated** [`DEVELOPING.md`](./DEVELOPING.md) (postinstall = `nuxt prepare` + `prisma generate`, Prisma 7 explicit seed, ESLint 10).
- **Updated** [`RELEASING.md`](./RELEASING.md) (CI: single `npm ci` via `postinstall`).
- **Updated** [`README.md`](../README.md) (pointer to upgrade checklist).
- **Added operator note for ModSecurity/CRS:** new helper config
  [`infl0-exclusion.conf`](../infl0-exclusion.conf) and where to include it
  (`REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf`).
- All markdown under `docs/`, `docs/RELEASING.md`, and the archived readability
  package spec (`docs/archive/26-04-24-readability-settings.md`) is
  maintained in **English** (in-app copy remains available in `en` and `de` via
  i18n).
- Developer-facing **comments** in `.ts` / `.vue` (including tests) are
  **English**; user-visible strings stay in i18n, not in comments.

### Security

- Bumped **dompurify** (3.3.3 → 3.4.1) via `npm audit fix` to address
  moderate-severity DOMPurify advisories. Used for article HTML sanitization
  (`ArticleCard`).

## [0.2.0] — 2026-04-24

Appearance and readability: UI preferences (theme, motion, fonts, and colors per surface) are persisted server-side; self-hosted font files included with OFL licensing; keyboard shortcuts available in the timeline; documentation and a planned/ focus for follow-up work.

### Breaking

- **Database (required):** Run `npx prisma migrate deploy` after deployment  
  (including migration `20260422120000_ui_prefs`) so user UI preferences can be persisted.
- **API (new):** `GET` and `PATCH /api/me/ui-prefs` require authentication.  
  Response and patch shape live in `utils/ui-prefs.ts` (`v`, surfaces, theme, motion, and optionally `seenFeatureAnnouncements`).  
  Existing guest-only app usage remains unchanged.

### Added

- **Settings → Appearance** (`/settings`)
  - Appearance: light / dark / system
  - Color palettes: Pastel / Warm, High Contrast, **custom colors**
  - Motion: system / reduced / standard
  - Per surface (front, back, reader):
    - font family (self-hosted)
    - font size
    - line height
    - custom background / text color
  - Live preview + server-side preference sync

- **Keyboard shortcuts in the timeline** (active card)
  - `+` / `=` / `-` / `0`: font size larger / smaller / reset
  - `Shift+K` / `Shift+L`: cycle font family
  - respects shortcut hygiene: no editable targets, explicit modifier handling

- **Self-hosted fonts**
  - local `woff2` files under `public/assets/fonts/`
  - no external font CDNs
  - license notice: SIL OFL 1.1 → [`public/assets/fonts/NOTICE.md`](../public/assets/fonts/NOTICE.md)

- **Recovery from unreadable settings**
  - “Default for this surface” button per surface
  - fixed high-contrast styling, independent of theme variables
  - resets the surface to app defaults

- **Dev data (`scripts/dev-data.ts`)**
  - can still create three demo cards and feeds
  - uses `DEV_SRP_SALT_HEX` / `DEV_SRP_VERIFIER_HEX` when present
  - compatible with `prisma db seed` / `.env.e2e`

### Changed

- **Local dev data (`npm run devData`)**
  - prefers SRP values from `process.env` when set
  - otherwise keeps previous fallback behavior (`dev@localhost` / password `dev`)
  - see README “Local seed data”

- **Documentation / navigation**
  - flatter `/settings` structure
  - footer context updates
  - details in [`DEVELOPING.md`](./DEVELOPING.md) and [`README.md`](../README.md)

### Removed

- **E2E test: readability shortcuts on the timeline**
  - removed experimental Playwright spec
  - to be replaced by the planned onboarding-based E2E strategy
  - existing settings / feeds authenticated smokes remain unchanged

### Documentation

- **Updated**
  - `CHANGELOG.md`
  - [`docs/DEVELOPING.md`](./DEVELOPING.md)
  - [`README.md`](../README.md)
  - [`docs/planned/README.md`](./planned/README.md)

- **Planned follow-ups**
  - central shortcuts help → [`planned/shortcuts-help.md`](./planned/shortcuts-help.md)
  - onboarding + welcome timeline → [`archive/26-04-30-onboarding-welcome-timeline.md`](./archive/26-04-30-onboarding-welcome-timeline.md)

## [0.1.0] — 2026-04-22

First **tagged** release intended as a reference point for operators and integrators.  
Covers the state of the app with personal RSS timeline, SRP authentication, Prisma, Nuxt 3, Playwright A11y smoke tests, JSON conventions for `/api/*`, and the documented accessibility baseline (landmarks, focus handling, reduced motion).

Detailed work leading up to this date remains traceable in  
**Archive — 2026-04-21**.

---

## Archive — 2026-04-21

*Consolidated from the former “Erledigt” section in `docs/ROADMAP.md`, grouped
by theme (no sprint numbering). When we start tagging releases, older archive
bullets can be copied under dated version headings.*

### Breaking

- None recorded for this consolidation window. When we introduce breaking
  changes (DB migrations, env vars, removed routes), they will appear under
  **Unreleased** with migration notes.

### Added

- **Help centre** (`/help`), editorial guidance in `docs/CONTENT_AND_A11Y.md`,
  security UX patterns (`InfoPopover`, `SecurityBadge`).
- **Page-level auth** via `definePageMeta({ auth })`, pure
  `resolveAuthDecision` / `runAuthMiddleware`, first component tests around
  auth-aware UI.
- **Timeline “show read”** preference: `useTimelinePreferences` with
  persistence, menu placement, shortcut `r`, help copy.
- **Skip link + `<main id="main">`** contract app-wide; layout `app.vue`
  centralises it; layoutless pages carry aligned copies; Playwright smoke
  `tests/e2e/a11y-layout-smoke.spec.ts` + axe on `/`, `/help`, `/login`.
- **Playwright E2E harness**: production build + Nitro on `127.0.0.1:4275`,
  `npm run test:e2e`, committed `.env.e2e`, SRP auth setup project, authed
  smoke for settings/feeds footers.
- **Feeds + settings footer shortcuts**: `AppFooterShortcuts` (teleported
  `contentinfo`), `SettingsPageFooter` wrapper, feeds page integration.
- **API surface hardening**: catch-all `server/api/[...path].ts` for JSON
  `404` on unknown API routes; Nitro middleware
  `server/middleware/00-api-json-content-type.ts` for default
  `application/json; charset=utf-8` on `/api/**`.
- **Score direction accessibility**: `utils/score-indicator.ts`,
  `components/ScoreDelta.vue`, unit tests; colour is not the only cue.
- **Modal stack** for overlays: `useModalStack`, shortcut `when` / editable
  guards, `ArticleCard` / `InfoPopover` registration, keyboard hint in modal
  chrome; behavioural tests for dialog close/cancel sync with stack.
- **Reduced-motion paths** for card flip, toasts, decorative motion; app
  chrome landmarks (`menu.navLandmark`, header/nav structure).

### Fixed

- **Timeline preference persistence** across remounts (writable `computed`
  setter instead of a dying `watch`).
- **`<dialog>` close paths** (`@close` / `@cancel`) keep `modalVisible` and
  modal stack in sync when the user dismisses via Escape, backdrop, or form
  dialog button.
- **Shortcuts**: ignore when focus is in editable fields; ignore with
  `Ctrl`/`Meta`/`Alt` held (fixes `Cmd+R` flipping read state on reload).
- **Glyph vertical alignment** in personalization deltas (inline layout vs
  problematic `inline-flex` centreing).

### Changed

- **Global `:focus-visible` baseline** in `assets/css/tailwind.css` for
  interactive elements; thin regression guard that the rule still exists.
- **Testing philosophy**: removed brittle source-regex UI guards in favour of
  mount / pure-function / Playwright checks where appropriate.

### Documentation

- Ongoing updates to `docs/CONTENT_AND_A11Y.md`, `docs/DEVELOPING.md`,
  `docs/ROADMAP.md` (now split: roadmap = vision + backlog; this file =
  shipped work).

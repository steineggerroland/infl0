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
  `Article` rows keep the shape `ArticleView` already consumes;
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

- **`/api/timeline` is now a deprecated alias.** Both `/api/timeline`
  and the new `/api/inflow` endpoint forward to the same handler in
  `server/utils/inflow-handler.ts` for one release. External callers
  and any cached client should migrate to `/api/inflow`; the alias
  is removed in the next minor release. The response shape changed
  from `Article[]` to `Array<{ type: 'article' | 'onboarding', ... }>`
  in both endpoints; if you consume `/api/timeline` from a script,
  filter by `type === 'article'` (or send the new
  `/settings` toggle off via `PATCH /api/me/ui-prefs` with
  `{ "onboardingHidden": true }`).

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

- **Settings section navigation.** `/settings`, `/settings/personalization`, and
  `/settings/privacy` use a dedicated **`settings` layout** with a DaisyUI `drawer`:
  sidebar from `lg:` up (`lg:drawer-open`), compact **Sections** control on narrow
  viewports, overlay close, and a `menu` of links to anchored blocks on the main
  settings page (`#display`, `#onboarding`, `#sorting`, `#tracking`) plus sibling
  routes. Stable **`id` hooks** (`#personalization`, `#privacy`) support deep links
  and tests.

### Fixed

- **Help shortcut `<kbd>` appearance.** Shortcut keys in `#shortcuts-reference`
  use DaisyUI `kbd` styling with a light-theme contrast tweak so keys stay readable
  on the help canvas.

### Documentation

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
  (`ArticleView`).

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
  guards, `ArticleView` / `InfoPopover` registration, keyboard hint in modal
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

# Changelog

Notable changes for **infl0** operators (self-hosters, integrators, future
contributors): **features**, **fixes**, and especially **breaking** behaviour
or configuration. Internal refactor-only work is omitted unless it affects
build, deploy, or extension points.

Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Release **versions** (e.g. `v0.3.0`) are assigned when we tag; until then,
new entries accrue under **Unreleased**.

## [Unreleased]

### Breaking

**Upgrading a running instance (checklist)** — pull this revision, then:

1. **Node** — Stay on the version in **`.nvmrc`** (Node **22+**; repo currently pins **24**). Prisma ORM 7 expects a recent Node; below 22 is unsupported.
2. **Install / build** — From the app root, with the correct Node version:
   - `npm ci` (or `npm install` in dev). **`postinstall`** runs **`prisma generate`** then **`nuxt prepare`**; a missing **`.env`** with `DATABASE_URL` is OK for generate (CLI uses a placeholder when unset).
   - `npm run build` before deploy (or your image build). **Runtime** still requires a valid **`DATABASE_URL`** for any code path that opens the DB (Nitro API, scripts).
3. **Prisma ORM 7**
   - **Schema:** `datasource` no longer contains `url`; connection for **migrations / CLI** is in repo-root **`prisma.config.ts`** (must be present in the deploy artifact — same directory as `package.json`).
   - **Client:** generated to **`generated/prisma/`** (gitignored). Regenerate with **`npx prisma generate`** or rely on **`npm ci`** / **`postinstall`**. Production Docker images run **`npx prisma generate`** after install so the folder exists inside the image.
   - **Runtime driver:** the app uses **`@prisma/adapter-pg`** with **`pg`**. Use a **direct TCP** Postgres URL in **`DATABASE_URL`** (e.g. `postgresql://…`). **Prisma Accelerate** URLs (`prisma://` / `prisma+postgres://`) are not wired to `PrismaPg`; switching to Accelerate would need a separate client setup.
   - **Migrations on deploy:** keep **`npx prisma migrate deploy`** (or your equivalent). Prisma 7 does **not** auto-run **`prisma generate`** after migrate/push; this repo’s **`db:migrate`**, **`db:push`**, and **`db:migrate:deploy`** scripts append **`prisma generate`** for you.
   - **Seeding:** `prisma migrate dev` / `db push` no longer auto-seed; run **`npx prisma db seed`** explicitly when you need seed data.
   - **SSL:** managed Postgres with previously “ignored” certificate issues may now fail validation (node-pg). Fix certs or configure SSL explicitly (see [Prisma upgrade guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)).
4. **Docker / OCI** — If you build from this repo’s **`Dockerfile`**: it now copies **`prisma/`** and **`prisma.config.ts`** **before** `npm ci`, and the production stage runs **`npx prisma generate`** after `npm ci --omit=dev`. Rebuild images from this tree; do not omit **`prisma.config.ts`** from the build context.
5. **Nuxt 4 + Tailwind CSS 4 + daisyUI 5** — No extra env vars. If you maintain **forked CSS** or **custom Tailwind theme** files, re-read [Tailwind v4 upgrade](https://tailwindcss.com/docs/upgrade-guide) and [daisyUI for Nuxt](https://daisyui.com/docs/install/nuxt/); stock infl0 uses **`@tailwindcss/vite`** and plugins in **`assets/css/tailwind.css`**.

### Changed

- **Framework / tooling:** **Nuxt 4**, **Vue 3.5.x**, **Vue Router 5**, **Tailwind CSS 4** (via **`@tailwindcss/vite`**), **daisyUI 5**, **Prisma ORM 7** (Rust-free client + **pg** adapter), **Vitest 4**, **ESLint 10**, **marked** 15.x; **`@nuxt/content`** and **`@nuxtjs/i18n`** remain on their current **latest** majors compatible with Nuxt 4.
- **Vue + Vite (dev):** **`vue`** and **`@vitejs/plugin-vue`** pinned to current patch minors for Vitest component tests.

### Documentation

- **Updated** [`DEVELOPING.md`](./DEVELOPING.md) (postinstall = `prisma generate` + `nuxt prepare`, Prisma 7 explicit seed, ESLint 10).
- **Updated** [`RELEASING.md`](./RELEASING.md) (CI: single `npm ci` via `postinstall`).
- **Updated** [`README.md`](../README.md) (pointer to upgrade checklist).
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
  - onboarding + welcome timeline → [`planned/onboarding-welcome-timeline.md`](./planned/onboarding-welcome-timeline.md)

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

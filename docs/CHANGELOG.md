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

- **Datenbank (erforderlich):** Nach Deployment `npx prisma migrate deploy` ausführen  
  (u. a. Migration `20260422120000_ui_prefs`), damit UI-Präferenzen persistiert werden können.
- **API (neu):** `GET` und `PATCH /api/me/ui-prefs` (auth erforderlich)  
  Shape siehe `utils/ui-prefs.ts` (`v`, Surfaces, Theme, Motion, ggf. `seenFeatureAnnouncements`).  
  Bestehende Gästeseiten bleiben unverändert.

---

### Added

- **Einstellungen → Darstellung** (`/settings`)
  - Appearance: hell / dunkel / System  
  - Farbpaletten: Pastell / Warm, Hoher Kontrast, **eigene Farben**  
  - Motion: wie System / reduziert / Standard  
  - Pro Oberfläche (Front, Back, Reader):
    - Schriftart (self-hosted)
    - Textgröße
    - Zeilenabstand
    - bei Custom: Hintergrund / Textfarbe  
  - Live-Vorschau + serverseitige Synchronisierung

- **Tastatur (Timeline, aktive Kachel)**
  - `+` / `=` / `-` / `0`: Schriftgröße (größer / kleiner / Standard)
  - `Shift+K` / `Shift+L`: Schriftart wechseln
  - berücksichtigt Shortcut-Hygiene (keine Eingabefelder, klare Modifier-Regeln)

- **Self-hosted Schriften**
  - lokale `woff2` unter `public/assets/fonts/`
  - keine externen CDNs
  - Lizenz: SIL OFL 1.1 → `public/assets/fonts/NOTICE.md` und je Familie
    `public/assets/fonts/<familie>/OFL.txt` (vollständiger upstream-Text)

- **Fallback bei unleserlichen Einstellungen**
  - „Standard für diesen Bereich“ pro Oberfläche
  - feste, kontrastreiche Darstellung (theme-unabhängig)
  - setzt Werte auf App-Defaults zurück

- **Dev-Daten (`scripts/dev-data.ts`)**
  - erstellt Demo-Kacheln und Feeds
  - nutzt `DEV_SRP_SALT_HEX` / `DEV_SRP_VERIFIER_HEX`, falls gesetzt
  - kompatibel mit `prisma db seed` / `.env.e2e`

---

### Changed

- **Dev-Daten (`npm run devData`)**
  - nutzt SRP-Variablen aus `process.env`, falls vorhanden
  - sonst Fallback wie bisher (`dev@localhost` / Passwort `dev`)
  - siehe README „Local seed data“

- **Dokumentation / Navigation**
  - flachere `/settings`-Struktur
  - Footer-Kontext angepasst
  - Details in `DEVELOPING.md` und `README.md`

---

### Removed

- **E2E-Test (Lesbarkeits-Shortcuts, Timeline)**
  - experimenteller Playwright-Spec entfernt
  - wird ersetzt durch stabilere Onboarding-basierte E2E-Strategie
  - bestehende Settings-/Feeds-Smokes bleiben unverändert

---

### Documentation

- **Aktualisiert**
  - `CHANGELOG.md`
  - `docs/DEVELOPING.md`
  - `README.md`
  - `docs/planned/README.md`
  - **Paket Lesbarkeit / Darstellung (Archiv):** historische Paket-Spezifikation
    unter `docs/archive/26-04-24-readability-settings.md` (kein aktives
    `planned/`-Dokument mehr)

- **Geplante Follow-ups**
  - zentrale Shortcut-Hilfe → `planned/shortcuts-help.md`
  - Onboarding + Welcome-Timeline → `planned/onboarding-welcome-timeline.md`

- **Dieses CHANGELOG** (strukturierter Unreleased-Block), [`docs/DEVELOPING.md`](./DEVELOPING.md) (E2E, `devData`, DB-Merge, Verweis Onboarding), [`README.md`](../README.md), [`docs/planned/README.md`](./planned/README.md).
- **Geplante Follow-ups (separat umsetzbar):** zentrale **Shortcuts-Hilfe** — [shortcuts-help.md](./planned/shortcuts-help.md); **E2E/Onboarding** mit Registrierung und festen Willkommens-Kacheln — [onboarding-welcome-timeline.md](./planned/onboarding-welcome-timeline.md).

---

## [0.1.0] — 2026-04-22

Erster **getaggter** Release zur Orientierung für Betreiber und
Integratoren. Umfasst den Stand der App mit persönlicher RSS-Timeline,
SRP-Auth, Prisma, Nuxt 3, Playwright-A11y-Smoke, JSON-Konventionen für
`/api/*`, sowie die dokumentierte Barrierefreiheits-Baseline (Landmarks,
Fokus, reduzierte Bewegung).

Detaillierte Vorarbeit vor diesem Tag bleibt im Abschnitt
**Archive — 2026-04-21** nachvollziehbar.

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

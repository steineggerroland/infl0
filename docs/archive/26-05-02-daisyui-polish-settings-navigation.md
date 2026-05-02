# Package: DaisyUI polish and settings navigation

## Status

**Done** (as of 2026-05-02). Checklist items 1–6 below are shipped; post-checklist,
**`AppFooterShortcuts`** uses DaisyUI **`footer`** / **`footer-center`** and
**`link`** / **`link-hover`** while keeping a semantic `<footer>` sibling of `<main>`.

**Source:** was `docs/planned/daisyui-polish-and-settings-navigation.md`.

## Follow-ups

- Optional UX pass on settings hub density / sidebar copy (no open engineering tasks).

## Goal

Make infl0's existing UI feel more consistent and easier to scan by reusing
DaisyUI components where they fit the product, while keeping infl0's own
theme tokens, privacy-first tone, and reading-focused surfaces intact.

Settings should be easy to scan: display, reading, sorting, tracking, and
advanced options without one undifferentiated wall of text — on mobile and desktop.

## Non-goals

- Do not convert article cards, onboarding cards, or reader surfaces to DaisyUI
  `card`; those surfaces are custom, content-heavy, and theme-specific.
- Do not introduce `navbar`, `dock`, or global app chrome unless the navigation
  model changes separately.
- Do not use `drawer` for the global burger menu; the current dropdown menu is
  intentionally small and floating.
- Do not adopt decorative/marketing components such as `hero`, `carousel`,
  `chat`, `rating`, or DaisyUI `timeline` for the product UI.
- Do not replace infl0 theme tokens with a stock DaisyUI theme. DaisyUI
  components consume the derived **`--color-*`** values from infl0's palette
  pipeline.

## Dependencies (reference)

- DaisyUI integration: `assets/css/tailwind.css`, `utils/infl0-theme-derive.ts`, `app.vue`.
- Settings: `layouts/settings.vue`, `pages/settings/index.vue`, personalization/privacy routes.
- Tests: `tests/component/SettingsLayout.test.ts`, `SettingsIndexPage.test.ts`, and related specs.

## Acceptance criteria (all met)

1. DaisyUI used where it reduces bespoke styling without hurting legibility or a11y.
2. Daisy hover/active/selected/disabled states align with infl0-derived colours across themes.
3. Settings has an explicit navigation structure on mobile and desktop.
4. Stable **`id`** anchors for deep links and tests (hub + sorting sub-blocks; display sub-anchors).
5. No article/reader/onboarding card converted to DaisyUI `card`.
6. Component tests cover navigation structure and theme-related UI.

## Shipped checklist

1. **Settings hub** — `settings` layout, Daisy **`drawer`** (`lg:drawer-open`), **`menu`** section links, scroll-spy (`composables/useSettingsNavSectionSpy.ts`). Hub anchors include **`#display-*`** (appearance, palette, typography block, per-surface **`#display-surface-*`**, motion) plus **`#onboarding`**, **`#sorting*`**, **`#tracking`**. **`/settings/personalization`** and **`/settings/privacy`** remain separate routes (in-page ids **`#personalization`** / **`#privacy`** on those pages only). **`utils/settings-hub-display.ts`** centralises surface scroll ids and nested-nav membership for the parent “Darstellung” row. **`.settings-hub-sidebar-menu`** overrides Daisy **`menu`** flex/grid so row spacing stays compact.
2. **`/feeds`** — `list` / `fieldset` / `alert` (see CHANGELOG).
3. **`/settings/personalization`** — `stats` / `stat` (see CHANGELOG).
4. **`/login`**, **`/register`** — `fieldset` / `label` / `alert` (see CHANGELOG).
5. **`/`**, **`/feeds`** empty — `alert` patterns (see CHANGELOG).
6. **`/help`** FAQ — `collapse` on `<details>` (see CHANGELOG).

## Implementation notes (retained)

- **Footer:** `components/AppFooterShortcuts.vue` — Daisy **`footer`** + **`link`**; infl0 tokens on **`infl0-app-footer`** / **`infl0-footer-link`**.
- **Ongoing Daisy primitives in product chrome:** `btn`, `input`, `select`, `toggle`, `radio`, `range`, `modal`, `tooltip`, `badge`, `kbd`, `loading`, `skeleton`, `table`, `alert`, `dropdown`, `menu`, `swap` (`AppUserMenu`).
- **Tabs** were considered unsuitable for the long single-page settings hub (hide content on small screens).

# Package: DaisyUI polish and settings navigation

## Status

In progress (settings navigation drawer shipped in app; remaining items below)

## Goal

Make infl0's existing UI feel more consistent and easier to scan by reusing
DaisyUI components where they fit the product, while keeping infl0's own
theme tokens, privacy-first tone, and reading-focused surfaces intact.

Settings should become easier to navigate: users should quickly find display,
reading, sorting, tracking, and advanced options without scanning one long page.
The structure must work well on mobile and desktop.

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
  components must consume the derived `--color-*` values from infl0's palette
  pipeline.

## Dependencies

- Current DaisyUI integration: `assets/css/tailwind.css`,
  `utils/infl0-theme-derive.ts`, and `app.vue`.
- Existing settings pages and component tests:
  `pages/settings/index.vue`, `pages/settings/personalization.vue`,
  `pages/settings/privacy.vue`, `tests/component/SettingsIndexPage.test.ts`.
- DaisyUI docs:
  - [`components`](https://daisyui.com/components/)
  - [`drawer`](https://daisyui.com/components/drawer/)
  - [`tabs`](https://daisyui.com/components/tabs/)
  - [`themes`](https://daisyui.com/docs/themes/)

## Acceptance criteria

1. DaisyUI components are used where they reduce local styling without making
   the UI less legible or less accessible.
2. DaisyUI hover, active, selected, and disabled states use infl0-derived
   colors across light, dark, high-contrast, and custom themes.
3. Settings has an explicit navigation structure that works on mobile and
   desktop.
4. The settings navigation exposes stable headings/anchors for deep links and
   tests.
5. No article/reader/onboarding card is converted to DaisyUI `card`.
6. Component tests cover the new navigation structure and at least one theme
   token contract.

## Implementation notes

- Good DaisyUI candidates:
  - `list`: feed/source rows and personalization rows with title, metadata, and
    actions.
  - `stats` / `stat`: compact personalization metrics and summary numbers.
  - `collapse` / `accordion`: help FAQ and expandable explanatory settings.
  - `fieldset` / `label`: form groups in login, register, feeds, and settings.
  - `alert`: inline empty, warning, and error states.
  - `divider`: only if local spacing stays compact; global list spacing must not
    leak into DaisyUI menus/lists.
  - `footer`: possible fit for `AppFooterShortcuts` if it keeps the current
    semantic footer landmark.
- Current good uses to keep:
  - `btn`, `input`, `select`, `toggle`, `radio`, `range`
  - `modal`, `tooltip`, `badge`, `kbd`
  - `loading`, `skeleton`, `table`, `alert`
  - `dropdown`, `menu`, `swap` in `AppUserMenu`
- Settings navigation recommendation:
  - Prefer DaisyUI `drawer` for Settings.
  - Desktop/tablet: persistent sidebar, e.g. responsive `lg:drawer-open`.
  - Mobile: drawer hidden by default, opened by a compact "sections" button,
    with overlay close behavior.
  - Sidebar content should be a DaisyUI `menu` of section links, not a second
    app navigation.
  - Keep sections on one route if possible, using anchors, so settings remain
    easy to scan and old deep links can be preserved.
- Tabs are a fallback if settings becomes a small set of peer views. For the
  current long-form settings, tabs are less suitable because they hide content
  and can become cramped on mobile.

## Candidate order

1. ~~Settings navigation with responsive drawer/sidebar and section anchors.~~ (layout `settings`, ids `#display`, `#onboarding`, `#sorting`, `#tracking`, `#personalization`, `#privacy`)
2. ~~Convert feed/source rows to DaisyUI `list`.~~ (`/feeds`: `fieldset` / `fieldset-legend`, `label` + inputs, `list` + `list-row` / `list-col-grow`, inline `alert` for errors / empty.)
3. ~~Convert personalization summary numbers to `stats` / `stat`.~~ (algorithm priors/blend row + expandable rank Stored/Live/Delta strip)
4. Improve form grouping with `fieldset` / `label`.
5. Audit inline empty/error states for `alert`.
6. Consider FAQ `collapse` only after Settings is done.

## Links

- PR:
- Discussion:

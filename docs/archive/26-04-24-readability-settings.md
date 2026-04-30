# Package: readability, themes, motion

Pulled from [`ROADMAP.md`](../ROADMAP.md) (field
**E. Readability, stimulation level, personal workflow**): readability
package, theme system, in-app reduced motion, calm visual accents. Items from
**A. Reading, focus, orientation** (shortcuts) are included here where they tie
directly to readability.

## Status

**Done** (MVP, as of 2026-04). Core deliverables of the package (three surfaces, self-hosted fonts, OFL, live preview in settings, persistence, motion, keyboard shortcuts) are implemented. Deviations from the original wording, review decisions, and further follow-ups: [below](#deviations-from-the-mvp-package-and-follow-ups).

## Deviations from the package text (MVP) and follow-ups

A checklist for **release planning** and reviews (not a per-line quality
judgement).

1. **Paths & licenses (fonts):** Files live under `public/assets/fonts/<family>/` (not `public/fonts/`). Canonical OFL-1.1 in `public/assets/fonts/NOTICE.md`, plus per family an upstream `OFL.txt` (copyright, reserved font names) next to the `woff2` files.
2. **Font set:** No **JetBrains Mono** in this delivery; instead system stacks plus Inter, Source Sans 3, Source Serif 4, Lexend, IBM Plex Sans, Fraunces, Atkinson Hyperlegible, OpenDyslexic. A separate **“Latin-Extended” subset** build step is not called out; we ship the variable `woff2` artifacts from Google Fonts and the OpenDyslexic upstream.
3. **“Show read items”:** The package described **moving the toggle to settings**; the review allowed keeping the **user-menu quick link** until the shortcut follow-up ships. **As implemented:** the toggle remains on the **timeline** and in the **user menu**; **no** duplicate block in settings. Next step: align with `shortcuts-help.md` / shortcut package, then possible move or consolidation.
4. **Help & acceptance criterion 5:** `/help` documents **timeline** shortcuts (arrows, W/S, E, Q, R, Escape) in the main. **Readability** shortcuts (font size, family) are **not** yet documented to the same level. The **central shortcuts reference** stays in [`../planned/shortcuts-help.md`](../planned/shortcuts-help.md).
5. **E2E:** No Playwright coverage for readability shortcuts on the timeline in this package; the experimental spec was removed (see `CHANGELOG.md`). More stable E2E → [`26-04-30-onboarding-welcome-timeline.md`](./26-04-30-onboarding-welcome-timeline.md).
6. **Feature toast** (new surfaces / colour nodes, acceptance criterion 11) and the related **one-time announcement** (`seenFeatureAnnouncements`) are **not** part of the completed MVP.
7. **Live preview layout:** Instead of a three-up mini preview, the three surfaces are stacked in one appearance panel in settings; live effect on preview and app matches the goal (no wait / no full reload).

## Decisions from external review

An external review suggested splitting the package into smaller iterations
and keeping “show read” as a quick toggle in the user menu. The resulting
stance:

- **Package scope stays.** The core value (live preview across three surfaces, free colour choice, motion setting, cross-device persistence) fits together; further splitting would add churn without much benefit.
- **“Show read” still moves to settings** but also gets a **keyboard
  shortcut** as a fast workflow. The shortcut package follows right after
  and will list the toggle in the shortcuts reference. The user menu entry
  stays until that shortcut package lands — no gap in workflow.
- **Motion keeps three values (`system | reduced | standard`).** Default
  is `system`; `reduced` forces reduced motion even against the OS; `standard`
  allows motion even when the OS requests reduced. The a11y concern that
  `standard` overrides OS preference is accepted: that is why it is never
  the default and is described in the UI as a deliberate user choice, not
  as “turn motion on”.

## Goal

Users have **cross-device** control over the presentation they actually feel
when reading:

- **Font size**, **line height**, **font family** for **card front**, **card
  back**, and **reader** (separate combinations because needs differ).
- **Background** and **text** colour for those three surfaces. Users pick
  freely or use presets (“themes”).
- **Reduced motion** as an app setting, in addition to
  `prefers-reduced-motion`.

The settings UI shows changes **live** without reload. Font size has
**keyboard shortcuts** so you can nudge it while reading if card text
doesn’t fit.

## Why this package (value)

- People read on very different devices and with different eyes — the app
  should adapt, not the other way around.
- Card front, back, and reader have very different space; a single global
  “bigger/smaller” is not enough.
- Settings you only see after navigation are not used well. **Live preview
  on the settings page** is central to the value.

## Non-goals

- **No third-party fonts from Google Fonts / a CDN.** All fonts ship with
  the app, self-hosted (privacy, offline, no third-party fingerprinting).
- No full design-system redesign. Colours go through **surface tokens**
  (background, text, maybe accent) first, not buttons/logos/marketing.
- No WYSIWYG theme designer (gradient editor, etc.). For v1, **per-surface
  colour fields** + **discrete type and spacing steps** are enough.
- No per-article settings; everything is global per surface.

## Scope / surfaces

We maintain **three presentation surfaces** with separate settings:

| Surface | Where | Typical need |
|---------|--------|----------------|
| `card-front` | Front of card in timeline | compact, clear hierarchy |
| `card-back` | Back of card (metadata / actions) | calm, scannable |
| `reader` | Full text (modal / reader) | large reading area, long sessions |

Per surface, configurable:

- `backgroundColor`
- `textColor`
- `fontFamily` (short, readable system stack as default + a small selection)
- `fontSize` (**whole pixels, per surface**, clamped to a safe range — see
  below)
- `lineHeight` (discrete steps, e.g. `tight / normal / relaxed`)

### Font size: numeric, per surface

No `xs/sm/md/lg/xl` steps. Each surface keeps its own `fontSize` in whole
**pixels**. That makes live preview honest (what you set is what you see)
and shortcuts useful: nudge `card-front` by 1 px when card copy overflows
without pulling the reader along.

- Unit: **px** (canonical in storage; the UI may show pt, ~1.333 px at 96 dpi).
- Range: `10 … 32` px, integers. Out-of-range values are clamped on
  parse/patch; non-finite values fall back to current or default.
- Defaults: `card-front` and `card-back` = `16 px`, `reader` = `18 px`.
- UI: slider **and** numeric field per surface for keyboard and mouse users.

Themes are **presets** of these values for all three surfaces at once (e.g.
“calm light”, “warm dark”, “high contrast”).

## Fonts

We ship a small **self-hosted** set under a free license (SIL OFL or
equivalent). No loading via Google Fonts or other third-party CDNs.

Selection principles:

- **One variable font file per family** as `woff2`, `font-display: swap`,
  with fallback to a system stack of the same class.
- **Subset** for Latin Extended-A so umlauts and common European characters
  are covered without shipping full Unicode.
- Preference for faces with **explicit readability guidance** (e.g. WebAIM,
  BDA). Candidates to validate at implementation:
  - **Atkinson Hyperlegible** (OFL, Braille Institute; low-vision) — good
    default sans.
  - **Inter** (OFL) as a second sans for compact UI.
  - **IBM Plex Serif** or **Source Serif 4** (OFL) as serif for long reading
    in the reader.
  - **JetBrains Mono** (OFL) for monospace (code in body text).
  - **OpenDyslexic** (OFL) or **Atkinson Hyperlegible** as a dyslexia-focused
    choice. Prefer OpenDyslexic if user testing agrees; else keep Atkinson.
- Each option should show **brief UI copy** for what it is for (“low
  vision”, “long reads”, “compact cards”, “code/monospace”).

License files: done — see `public/assets/fonts/NOTICE.md` and per family
`OFL.txt` next to the font files.

## Reduced motion

- Setting `motion: system | reduced | standard` (default `system`).
- Applied via a root flag (e.g. class on `<html>`) that hits the same CSS
  paths as `@media (prefers-reduced-motion: reduce)`.
- `reduced` **forces** reduced paths; `standard` **allows** motion even when
  the OS requests reduced (explicit user choice).

## Navigation / new “Settings” entry

We add a **dedicated top-level “Settings”** item that groups existing
`/settings/*` (personalisation, timeline weighting, privacy) and adds the
new **“Appearance”** area (this package) on its own subpage.

In that move, **“show read” leaves the user menu** (today `AppUserMenu.vue`,
`useTimelinePreferences`) **for the settings area**. Rationale: it is a
persistent display preference, not a one-off action, and belongs with other
“how I want my timeline to look” settings.

External feedback correctly noted that “show read” is also a **fast
workflow** on the timeline, and removing it from the menu without a
similarly fast path would be a regression. Mitigation:

- “Show read” gets a **keyboard shortcut** that works on the timeline any
  time (no trip to settings, no menu to open).
- The exact binding ships in the **shortcuts package right after** this
  one. This package only records the requirement; the shortcuts reference
  should list the toggle.
- Until the shortcut package lands, the existing quick toggle in the user
  menu **stays**. It is removed **together with** the shortcut feature, not
  before, so there is no workflow gap for regular users.

Migration plan:

- `useTimelinePreferences` stays as a composable.
- `localStorage` key stays (compatibility); the value is also mirrored
  server-side in `useUiPrefs()` once the UI prefs API exists.
- When the user menu entry goes away, a small “open settings” fallback can
  remain for users who knew the toggle; with the shortcut in place, that is
  discovery only, not the main path.

## Keyboard shortcuts

- Increase font size: `=` / `+` (**+1 px**)
- Decrease: `-` (**−1 px**)
- Reset to default: `0` (surface default: 16 or 18 px)
- Target the **currently visible surface** (timeline → card front; reader
  open → reader). Back of card is only changed in settings, with live
  preview there.
- At clamp bounds (10 / 32 px) show no error; the shortcut is simply a
  no-op.
- `Shift+K` / `Shift+L`: previous / next **font** in the configurable list
  (not bare `K`/`L`, partly due to macOS `Alt+L` binding).
- All shortcuts follow `defineShortcuts` hygiene (no fire in text fields;
  `alt+…` / `shift+…` as explicit entries; unmodified keys without
  Cmd/Ctrl/Meta, see `composables/useShortcuts.ts`).

### Follow-up: E2E (Playwright)

Shortcuts on the **timeline** are **not** covered by Playwright today —
covered in Vitest (`useShortcuts`, `useUiPrefs`). **Open:** at least one
authed E2E smoke that sends e.g. `+` / `0` / `Shift+L` and checks prefs or
visible tokens. Sensible to ship with the later shortcuts help page.

## Persistence (architecture)

- **Cross-device in the database**, like timeline score prefs and
  engagement tracking prefs:
  - Column on `User` (or separate type) with JSON preferences.
  - Two new endpoints (names aligned with existing convention):
    - `GET /api/me/ui-prefs`
    - `PATCH /api/me/ui-prefs`
  - `useUiPrefs()` composable on the Nuxt client with **server fetch on
    first use**, debounced `PATCH` on change.
- **Fallback** for signed-out or cold sessions: apply from `localStorage`
  immediately, reconcile with the server after sign-in. No double writers.
- To avoid the feeling of “settings snap back”: **optimistic** UI, server
  wins on conflict.

### Data shape (proposal)

```json
{
  "version": 1,
  "theme": "custom",
  "motion": "system",
  "surfaces": {
    "card-front": {
      "backgroundColor": "#1f2937",
      "textColor": "#e5e7eb",
      "fontFamily": "system-ui",
      "fontSize": 16,
      "lineHeight": "normal"
    },
    "card-back": { "…": "…" },
    "reader": { "…": "…" }
  }
}
```

Migration rule: ignore unknown fields, missing fields fall back to
defaults; `version` stays until a breaking form change (then `version: 2` +
migration).

## Live preview in settings

The settings page shows all three surfaces **at once** as mini preview:
to the right (or below on mobile) small examples for `card-front`,
`card-back`, `reader`. Changes apply immediately to the preview **and** the
whole app (not preview-only) so you see real impact.

## Focus ring

The global focus ring in `assets/css/tailwind.css` already uses
`outline: 2px solid currentColor` with `outline-offset: 2px`, so the ring
follows the **current text colour** of the focused surface — even when users
pick per-surface colours.

Requirements for this package:

- No regression of that baseline; `tests/unit/focus-visible-baseline.test.ts`
  stays green.
- Contrast warning (below) checks **text vs. background**; with `currentColor`
  on the ring, contrast is covered in the same check.
- If a preset or user colour makes the ring hard to see, the same warning
  applies — no second contrast pass only for the ring.

## Structural and feature changes

Guideline:

- **Purely structural refactors** (e.g. splitting a card while the surface
  stays `card-front`): user colours and type stay **visible** because the
  same surface variable still applies.
- **New surface / new colour node** (e.g. `card-accent` or a knowledge tile
  with its own background): on first release, get a **sensible default
  from the active preset**. The user gets a light **toast**: “New display
  option available” with a link to the new control under
  `/settings` (appearance).
- Such toasts **once per user per feature**, tracked in `useUiPrefs()`
  (e.g. `seenFeatureAnnouncements: string[]`), so they do not repeat if
  ignored.

## Acceptance criteria (MVP)

1. **Three surfaces:** user can set `backgroundColor`, `textColor`,
   `fontFamily`, `fontSize`, `lineHeight` per surface; presets switch all
   three in one step.
2. **Free colours:** colour inputs; contrast warning if text/background
   falls below WCAG AA. We do not block; we warn and suggest a safe
   alternative.
3. **Live preview:** changes in settings apply within **<200 ms** without
   reload, in preview and app.
4. **Persistence:** stored in the database; after sign-in, available on a
   second device. `localStorage` is fallback only.
5. **Shortcut:** `+`, `-`, `0` change font size for the visible surface;
   shortcuts are listed on the help page and the upcoming shortcuts
   reference.
6. **Motion:** `motion: reduced` forces the same paths as the media query;
   `motion: standard` can override the media query — documented user
   choice.
7. **A11y:** no regression in Playwright/axe smokes; focus ring visible in
   all presets; contrast warning has a text alternative.
8. **No FOUC:** on first load, theme is applied **before** first paint
   (server render or inline bootstrap) for all surface variables.
9. **Self-hosted fonts:** no third-party font requests; shipped fonts
   (including at least one dyslexia-friendly option) under
   `public/assets/fonts/` with `NOTICE.md` and per-family `OFL.txt`.
10. **Settings navigation:** top-level “Settings” exists; “Appearance” is
    reachable; “show read” was to move from the user menu to settings with
    behaviour preserved for existing `localStorage` users (see deviations
    above for actual menu placement).
11. **Feature hint:** if a new surface or colour node ships later, the
    user gets a one-time toast with a link to the relevant settings.

## Technical building blocks (sketch)

- **CSS variables** per surface, e.g. `--front-bg`, `--front-fg`,
  `--front-font-family`, `--reader-…`. Tailwind / DaisyUI classes use these
  instead of hardcoded values.
- **Root data attributes:** `<html data-infl0-theme="…" data-motion="…"
  data-surface-preview="card-front">` — preset IDs in `data-infl0-theme`
  (DaisyUI uses `data-theme` separately, currently fixed `data-theme="light"`);
  `data-surface-preview` optional for preview.
- **Composable** `useUiPrefs()` with reactive values; setters update CSS
  variables and optimistic state, then `PATCH`.
- **Help** entry in `pages/help.vue` explains surfaces and shortcuts.

## Decided items (for implementation)

- **Fonts:** self-hosted, OFL. At least one dyslexia-friendly option
  (Atkinson and/or OpenDyslexic). No Google Fonts / CDN.
- **Focus ring:** stays `currentColor`-based; no second contrast check.
- **Navigation:** top-level “Settings” with “Appearance” subpage. “Show
  read” moves from the user menu (see deviations for ship order).
- **Structural changes:** custom colours stay as long as the surface id
  stays. New colours/surfaces get preset defaults and a one-time toast.

## Open questions

- Default dyslexia-friendly font: Atkinson Hyperlegible (readability, modern)
  or OpenDyslexic (explicitly for dyslexia)? Tendency: offer both, Atkinson as
  default.
- Should the “new display option” toast appear on every page or only on the
  next timeline visit so deep reading is not interrupted?
- How much do we steer serif/monospace per surface (e.g. reader defaults to
  serif) vs. leave everything user-chosen with light recommendations only?

## Risks

- **Too many controls** → settings feel technical. Counter: presets as
  default, advanced tuning visible but not dominant.
- **Poor contrast** from free colours. Counter: warning + safe alternative.
- **FOUC** on theme change. Counter: SSR-friendly token setup; respect
  reduced motion in transitions.

## Suggested order

1. Data shape, composable, endpoints, server persistence, `localStorage`
   fallback.
2. CSS variable baseline for three surfaces; migrate components to variables
   (minimal: background, text, font size).
3. Self-hosted fonts (`public/…` + `@font-face` + licenses) in dropdowns.
4. Top-level settings + “Appearance”; migrate “show read” into that area
   (per review / deviations).
5. Settings page with live preview and presets.
6. Free colours and contrast warning.
7. Shortcuts (`+`, `-`, `0`) and help copy.
8. Motion setting and integration with existing motion paths.
9. Toast mechanism for new display options.
10. A11y review; add contrast smokes in Playwright.

## Links

- Product context: `docs/ROADMAP.md` — field **E. Readability, stimulation
  level, personal workflow**.
- Editorial / a11y: `docs/CONTENT_AND_A11Y.md`.
- After shipping: entry in `docs/CHANGELOG.md` → `[Unreleased]` (see
  appearance / readability section).

# Package: keyboard shortcuts, help & reference

## Status

**Done** (MVP, as of 2026-04-27). The central keyboard-shortcut reference
now lives on the existing help page (`/help#shortcuts-reference`) and is
sourced from a single catalog in code (`utils/app-shortcuts.ts`) so the
visible list cannot drift out of sync with the actual `defineShortcuts`
call sites. Acceptance criteria below are crossed off; deviations and
follow-ups are listed in the next section.

## Goal

Readability and app shortcuts are **documented in plain language** for
users: where they apply, which key does what, and how they show up in the
central **shortcut / help** surface(s). This closes the gap with the
previous help page (timeline shortcuts there, but no full readability
matrix).

## Non-goals

- A complete, app-wide keyboard map of all future actions (can grow
  iteratively).
- Changing `defineShortcuts` or focus rules — that stays in each feature or
  refactor.
- An on-screen cheat-sheet overlay (e.g. press `?` to toggle a modal).
  Documented in [Follow-ups](#follow-ups) as a possible later step.

## Dependencies (now satisfied)

- Stable readability shortcuts in the **app** (`ArticleView`,
  `useShortcuts`) — already shipped with the readability package.
- Decision on **where** the central reference lives — chose the existing
  help page with a stable anchor (`#shortcuts-reference`); kept the FAQ
  entry under `help.items.shortcuts` as a short pointer for the
  question-style help.

## Acceptance criteria

1. **Readability shortcuts** (font size, font family, font reset) are
   described in **one** agreed place in help (✅ — `/help#shortcuts-reference`,
   group `readability`).
2. **Key bindings and constraints** (only on the focused/selected card,
   no firing in text fields, modal-aware silence, no Ctrl/Cmd/Alt chords)
   are listed **in plain language** under "When shortcuts are active" of
   the same section (✅).
3. **(Optional) E2E smoke** that the help path/anchor loads and the
   described section exists — not the full shortcut matrix in Playwright
   (deferred; tracked under
   [`onboarding-welcome-timeline.md`](../planned/onboarding-welcome-timeline.md)
   so an authed test can land on a stable timeline first).

## Implementation summary

- **Single source of truth:** `utils/app-shortcuts.ts` declares the
  `SHORTCUT_GROUPS` catalog (id, entries, key combos) plus the pure
  `tokenizeShortcutKey()` renderer for the visible `<kbd>` tokens. The
  catalog is consumed by `pages/help.vue` to build the reference; the
  composable contract that actually owns the keys (`defineShortcuts` in
  `pages/index.vue`, `components/ArticleView.vue`,
  `components/InfoPopover.vue`) is unchanged.
- **i18n:** group titles, summaries, the four scope rules and the
  per-entry plain-language label + description live under
  `help.shortcutsReference.*` in both `de.json` and `en.json`. Adding a
  new shortcut means: register it in the catalog **and** add its label /
  description to both locales — the component test fails loudly when
  either step is missing.
- **Help page:** the existing `/help` keeps its FAQ list and adds a
  **dedicated section** at `#shortcuts-reference`, linked from the table
  of contents above the FAQ. The FAQ entry under `help.items.shortcuts`
  was rewritten to point at the new section.
- **Tests:**
  - `tests/unit/app-shortcuts.test.ts` pins the tokenizer (`R`, `Shift +
    L`, `↑`, `Esc`, `Num +` …) and the catalog invariants (unique ids,
    non-empty entries, presence of the three core groups).
  - `tests/component/HelpPageShortcutsReference.test.ts` mounts the page
    with the real `de` and `en` JSON locales and asserts the contract
    above (anchor + heading, every group + entry rendered, `<kbd>` tokens
    match the catalog, scope rules listed, `de` mirrors `en`).
  - `tests/unit/shortcuts-coverage.test.ts` is the **drift guard**: it
    scans every `defineShortcuts(...)` call in `pages/`, `components/`,
    and `composables/` (via `import.meta.glob` + a small parser in
    `tests/_helpers/parse-define-shortcuts.ts`) and asserts that every
    registered key is either listed in `SHORTCUT_GROUPS` or on a
    `KNOWN_UNDOCUMENTED_KEYS` allow-list with a required, non-empty
    reason. The inverse direction is checked too: every catalog combo
    must be registered somewhere — dead rows / typos like `'shift+m'`
    fail the test loudly. The list of expected caller files
    (`pages/index.vue`, `components/ArticleView.vue`,
    `components/InfoPopover.vue`) is soft-pinned, so a future shortcut
    in a new location forces a conscious update of the test.

## Deviations from the original draft

- The package text was deliberately quiet about modal/popover dismissal
  (Escape). The reference covers it explicitly under group `article`
  (`closeSurface`) so users of the original-article reader and
  `InfoPopover` discover the dismissal key in the same place.
- `help.items.shortcuts` (the FAQ entry) was kept and rewritten instead
  of removed, so the existing question-style help link from
  `SecurityBadge` and other deep links keeps working. The entry now
  defers to the new reference for the full table.

## Follow-ups

- **On-screen cheat sheet** (e.g. `?` opens a modal listing the same
  catalog). Cheap to add now that `utils/app-shortcuts.ts` is the source
  of truth — separate package when there is product demand.
- **E2E smoke** that visits `/help` and asserts the
  `data-testid="help-shortcuts-reference"` section renders for both
  locales, and that anchor scrolling works. Deferred until the
  onboarding/auth E2E foundation lands; the unit + component tests
  already cover render correctness.
- Keep the catalog **strictly sorted by user discoverability**, not by
  alphabetical key. As more shortcuts arrive, audit the order during
  review.

## Implementation notes (for future maintainers)

- Relevant paths: `pages/help.vue`, `utils/app-shortcuts.ts`,
  `i18n/locales/{de,en}.json` (`help.shortcutsReference.*`),
  `tests/unit/app-shortcuts.test.ts`,
  `tests/component/HelpPageShortcutsReference.test.ts`.
- When a feature adds a new shortcut, prefer extending an existing group
  in the catalog over creating a new one. Reserve a new group for a new
  surface (e.g. a settings keyboard map).

## Links

- PR: *(set after merge)*
- Discussion: `ROADMAP.md`, `planned/README.md`,
  [`onboarding-welcome-timeline.md`](../planned/onboarding-welcome-timeline.md)

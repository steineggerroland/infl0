# Package: keyboard shortcuts, help & reference

## Status

Draft — follows the **shipped** appearance and readability behaviour in
the app; details and acceptance criteria to be agreed separately.

## Goal

Readability and app shortcuts are **documented in plain language** for
users: where they apply, which key does what, and how they show up in the
central **shortcut / help** surface(s). This closes the gap with the
current help page (timeline shortcuts there, but not a full readability
matrix) — **this** package is where that consolidation lives.

## Non-goals

- A complete, app-wide keyboard map of all future actions (can grow
  iteratively).
- Changing `defineShortcuts` or focus rules — that stays in each feature or
  refactor.

## Dependencies

- Stabilise readability shortcuts already in the **app** (`ArticleView`,
  `useShortcuts`) where follow-up is still needed.
- Decide whether **one** central help page, a modal, or a submenu holds the
  “shortcuts reference”.

## Acceptance criteria

1. Readability shortcuts (font size, font family, etc., as implemented) are
   described in **one** agreed place in help.
2. Key bindings and constraints (e.g. only with a focused/selected card, no
   firing in text fields) are understandable **in plain language** for users.
3. (Optional) E2E smoke only checks that the help path/anchor **loads** and
   the described section **exists** — not the full shortcut matrix in
   Playwright.

## Implementation notes

- Relevant paths: `pages/help.vue`, `composables/useShortcuts.ts`, i18n as
  needed.
- Risk: duplicate or stale lists — a single long-term source (e.g. shared
  constants or a generated table) is sensible, not part of this draft.

## Links

- PR: *(TBD)*
- Discussion: `ROADMAP.md`, `planned/README.md`

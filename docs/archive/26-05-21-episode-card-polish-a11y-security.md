# Package: Episode card polish, a11y, and HTML safety

## Status

Done (2026-05-21)

## Goal

Round off the new episode reader experience so it is maintainable, accessible,
and explicit about how crawler-provided Markdown/HTML is rendered. The visible
feature already works; this package removes remaining lint warnings, tightens
keyboard/a11y behavior, and documents the security boundary in code and tests.

## Non-goals

- Changing the episode card layout or adding new episode features.
- Reworking article card behavior.
- Introducing a full Screenplay test architecture.
- Supporting TopicKnowledgeCrawler sections in the UI.

## Dependencies

- Existing episode card implementation:
  `components/EpisodeCard.vue`,
  `components/EpisodeCollapsibleSection.vue`, `components/Infl0Icon.vue`.
- Markdown rendering and sanitization path in `components/EpisodeCard.vue`.
- Icon registry in `utils/icons/registry.ts`.
- Existing component/unit coverage for `EpisodeCard`, `Infl0Icon`, and playback.

## Acceptance criteria

1. `npm run lint` has no EpisodeCard / Infl0Icon warnings.
2. `Infl0Icon.label` has an explicit default and the decorative vs accessible
   icon contract is covered by tests.
3. Episode cover images follow Vue lint rules and retain useful alt text.
4. All `v-html` usage in episode UI is backed by an explicit sanitizer/helper
   boundary with tests for allowed Markdown and stripped unsafe HTML.
5. Episode details dialog has a clear accessible name, close control label, and
   predictable tab semantics.
6. Keyboard behavior is verified for opening details, switching tabs, closing
   the dialog, and returning focus to the initiating card action.
7. The minimal episode BDD scenario remains focused on core actions; deeper
   a11y/security assertions live in component/unit tests.

## Implementation notes

- Episode details dialog now has `aria-labelledby`, a visible title, a labelled
  tablist, tab/tabpanel `aria-controls` wiring, roving `tabindex`, arrow-key
  navigation, Home/End support, a labelled close button, and focus return to the
  triggering details action.
- Episode Markdown rendering moved behind `SafeMarkdown` and
  `renderSafeMarkdown()`, making the DOMPurify boundary explicit and directly
  testable.
- `Infl0Icon` now has an explicit default for optional labels and tests for
  decorative vs accessible icon output.
- Article full-text rendering was brought in line with the episode dialog:
  `ArticleView.vue` was renamed to `ArticleCard.vue`, uses the shared
  `SafeMarkdown` sanitizer boundary, exposes a labelled reader dialog, and
  returns focus to the triggering card action on close.
- Lint warnings for self-closing cover image, `v-html`, and icon label default
  are resolved.
- Verification: `npm run lint`, `npm run typecheck`, and `npm run test`.

## Links

- PR:
- Discussion: local development thread after
  `docs/archive/26-05-19-reader-episode-content-presentation.md`

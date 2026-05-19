# Package: reader episode content presentation

## Status

Done (2026-05-19 / commits `05067f3`, `bc430df`)

## Goal

Podcast episodes from TopicKnowledgeCrawler should be stored, mapped into the
inflow, and rendered as first-class reader cards without weakening article
behavior. Rich episodes show their podcast metadata, actions, chapters,
shownotes, and details content; sparse episodes stay compact and only expose the
core fields that exist.

## Non-goals

- Replacing article cards or changing article read semantics.
- Public sharing or bookmarkable episode URLs.
- UI support for article sections; unsupported section ingest remains a storage
  / contract concern.
- Full Screenplay architecture for BDD; this package uses lighter screen
  objects.

## Dependencies

- TopicKnowledgeCrawler ingest examples and episode payload contract.
- Inflow mapping for article and episode timeline items.
- Reader read-state and engagement paths.
- Cucumber BDD setup with browser-level account registration and crawler ingest.

## Acceptance criteria

1. Podcast episodes render in the reader through a dedicated episode card.
2. Rich episode cards show metadata, browser playback affordance, podcast/feed
   links, chapters, shownotes, and detail tabs for content/transcript.
3. Minimal episode cards show core fields and omit absent optional sections.
4. Article cards keep their rich/minimal presentation behavior.
5. Read-state handling continues to work for reader content.
6. Demo seed data includes podcast episodes.
7. BDD coverage describes article/episode presentation in product-facing
   language.
8. Shared BDD UI glue is split into named screen objects instead of a broad
   helper module.

## Implementation notes

- Episode UI: `components/EpisodeCard.vue`,
  `components/EpisodeCollapsibleSection.vue`, `components/Infl0Icon.vue`.
- Icon registry and playback helpers: `utils/icons/registry.ts`,
  `utils/episode-playback.ts`.
- Inflow/read-state integration: `pages/index.vue`,
  `server/utils/inflow-handler.ts`,
  `server/api/me/articles/[articleId]/read-state.patch.ts`.
- Demo data: `prisma/seed-podcast-episodes.ts`, `utils/episode-seed.ts`.
- BDD behavior: `features/content_presentation.feature`,
  `features/steps/content-presentation.steps.js`,
  `features/support/content-fixtures.js`.
- BDD screen objects: `features/support/reader-timeline.js`,
  `features/support/sources-page.js`, `features/support/settings-page.js`,
  `features/support/user-menu.js`, `features/support/auth-ui.js`.

## Links

- PR:
- Discussion: local development thread, `features/content_presentation.feature`

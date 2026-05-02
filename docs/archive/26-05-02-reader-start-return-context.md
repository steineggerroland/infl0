# Package: reader start and return context

## Status

Done (2026-05-02)

## Goal

Opening infl0 should no longer feel like being dropped into a moving reader.
After onboarding is hidden, users get a deliberate reader start screen before
article cards render. This avoids accidental dwell/read tracking on passive
visits and gives users a conscious choice between starting fresh at the current
inflow top or resuming from their stored return context.

## Non-goals

- Public, shareable, or bookmarkable article deep links.
- A manual "mark as unread" action.
- Deleting engagement history or return context when the user starts fresh.
- Duplicating the Cucumber scenarios in documentation; feature files remain the
  executable behavior list.

## Dependencies

- `uiPrefs` persistence for `lastReaderSessionStartedAt`.
- Inflow API stats for `newSinceLastReaderSession`.
- Local return-context storage and internal URL sync.
- Engagement tracking and read-state feedback in `ArticleView`.
- HTTP-accessible BDD setup through feed creation and crawler ingest.

## Acceptance criteria

1. Onboarding cards still render immediately while onboarding is active.
2. With onboarding hidden, opening `/` shows the reader start screen instead of
   article cards.
3. Passive opening and navigating away does not mark an article as read.
4. Starting fresh opens the first current inflow article.
5. Resuming opens the stored article when a valid return context exists.
6. The start screen shows the count of articles added since the last deliberate
   reader start.
7. Read articles show visible read-state feedback.
8. Reader BDD scenarios avoid direct database access when API/UI setup is
   available.

## Implementation notes

- Main reader flow: `pages/index.vue`.
- Return context helpers: `utils/inflow-return-context.ts`,
  `utils/inflow-route.ts`.
- Internal route wrappers: `pages/inflow/article/[id].vue`,
  `pages/inflow/onboarding/[topic].vue`.
- Preferences: `utils/ui-prefs.ts`, `composables/useUiPrefs.ts`.
- Inflow stats: `server/utils/inflow-handler.ts`.
- Read feedback / engagement: `components/ArticleView.vue`,
  `composables/useEngagementTrackingPrefs.ts`.
- Behavior coverage: `features/reader_return_context.feature` with glue in
  `features/steps/reader.steps.js`.

## Links

- PR:
- Discussion: local development thread, `features/README.md`

# Package: Read state without tracking

## Status

In progress

## Goal

Separate “read” from engagement tracking so every user gets a working
read/unread timeline, including users who opted out of reading-behaviour
analysis. The UI should mark an active article as read after the same short
visibility threshold, update immediately, and let users click the read-status
symbol to mark an article as unread again.

## Non-goals

- Do not redesign timeline ranking, scoring, or engagement aggregates.
- Do not add manual read/unread bulk actions.
- Do not change the meaning of the engagement-tracking preference; it remains
  about reading-behaviour analysis for sorting/personalization signals.
- Do not infer read state from historical `engagedSeconds` once a user has
  manually marked an article unread.

## Dependencies

- Database: reuse `UserTimelineItem.readAt`; no schema change expected.
- API: add a read-state endpoint that updates only the authenticated user's
  timeline row.
- UI: `ArticleView.vue` owns visibility timing and the read-status affordance.
- Copy/i18n: add labels for “Mark as read” / “Mark as unread” if needed.

## Acceptance criteria

1. With engagement tracking enabled, keeping the selected article visible for
   the read threshold marks it read immediately, without waiting for another
   interaction or navigation.
2. With engagement tracking disabled, the same visibility threshold still marks
   the selected article read, but no article-engagement event or aggregate is
   written.
3. Engagement dwell reporting no longer sets `readAt`; it only records
   engagement when tracking is enabled.
4. Clicking the read-status symbol toggles read state for the current article:
   read articles can be marked unread, unread articles can be marked read.
5. Marking an article unread clears `readAt`, updates the UI immediately, and
   keeps the article visible or hidden according to the current `showRead`
   setting after the next timeline refresh.
6. Previously accumulated `engagedSeconds` must not immediately re-mark an
   article read after “mark unread”; only a fresh frontend read-state action or
   new visibility threshold may do that.
7. The backend rejects read-state changes for articles that are not on the
   authenticated user's timeline.

## Implementation notes

- Add a small API route, for example
  `PATCH /api/me/articles/:articleId/read-state`, accepting
  `{ "read": true | false }`.
- Keep backend ownership of persistence and authorization; let the frontend own
  the visibility decision because it knows which article is selected, visible,
  and actively being read.
- Use optimistic UI in `ArticleView.vue`, then reconcile on failure by restoring
  the previous `readAt`.
- The read timer should ignore server render, hidden tabs, and unselected
  articles. It can share the existing threshold from `utils/article-engagement`
  or move that constant to a read-state utility if naming becomes confusing.
- Consider using `aria-pressed` or an equivalent accessible button pattern for
  the read-status symbol; the current quiet visual hint should become an actual
  control.
- Update component/unit tests for the read-status control and API/unit tests
  for authorization, read, unread, and tracking-disabled behavior.

## Links

- PR:
- Discussion: local development thread, read-state vs engagement-tracking split

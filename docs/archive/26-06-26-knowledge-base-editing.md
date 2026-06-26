# Package: Knowledge Base — Text Editing

## Status

Done — completed in PR #73 as ReadingNote editing across inline text work, popovers, and the global reading-notes overview.

## Goal

Users can edit existing reading notes (quotes, summaries, notes) to refine their understanding or correct mistakes. Editing is distinct from creation — it updates existing source-bound reading notes without deleting and recreating them.

## Non-goals

- Collaborative editing (real-time or multi-user).
- Version history or edit logs.
- Rich text or markdown formatting in reading notes (plain text only).
- Undo/redo stack (user can reload to undo mistakes).

## Dependencies

- Package 1 (Text Work) — reading notes must exist before they can be edited.
- `reading_notes` table (schema in Package 1).

## Acceptance criteria

1. **Edit trigger**
   - On a reading-note card, a small "pencil" icon opens edit mode.
   - Edit mode is triggered by keyboard shortcut `e` (when focus is on the reading-note card).

2. **Edit form**
   - Fields: `context`, `content`, `tags` (comma-separated, normalized).
   - All fields are optional; user can change any subset.
   - Pre-populated with current values.

3. **Save confirmation**
   - Submit updates the reading note in DB.
   - UI updates immediately (no reload needed).
   - Toast message: "Reading note updated".

4. **Cancel**
   - Esc key or "Cancel" button discards changes.
   - Original values remain unchanged.

5. **Deletion during editing**
   - Delete button still works while in edit mode.
   - Deleting clears the form without saving.

6. **API**
   - `PATCH /api/knowledge/reading-notes/:readingNoteId` -> updates a reading note (only provided fields).
   - Request body shape: `{ context?: string; content?: string; tags?: string[] }`.

7. **Episode support**
   - Edit UI appears identically for reading notes from articles and episodes.
   - No special handling for episode metadata.

## Implementation notes

- **Inline editing**: Modify existing reading-note card component to toggle between display/edit mode.
- **Tag normalization**: Reuse same normalization logic as creation (lowercase, trim, dedupe).
- **Optimistic update**: Use Vue reactivity to show updated values before server confirms (reduce perceived latency).

## Links

- PR: #73
- Depends on: Knowledge Base Text Work (Package 1, archived after PR #71)
- Precedes: `knowledge-base-connections.md` (Package 2)

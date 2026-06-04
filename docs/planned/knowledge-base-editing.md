# Package: Knowledge Base — Text Editing

## Goal

Users can edit existing knowledge fragments (quotes, summaries, notes) to refine their understanding or correct mistakes. Editing is distinct from creation — it updates existing atomic knowledge units without deleting and recreating.

## Non-goals

- Collaborative editing (real-time or multi-user).
- Version history or edit logs.
- Rich text or markdown formatting in fragments (plain text only).
- Undo/redo stack (user can reload to undo mistakes).

## Dependencies

- Package 1 (Text Work) — fragments must exist before they can be edited.
- `knowledge_fragments` table (schema in Package 1).

## Acceptance criteria

1. **Edit trigger**
   - On fragment card, a small "pencil" icon opens edit mode.
   - Edit mode is triggered by keyboard shortcut `e` (when focus is on fragment card).

2. **Edit form**
   - Fields: `context`, `content`, `tags` (comma-separated, normalized).
   - All fields are optional; user can change any subset.
   - Pre-populated with current values.

3. **Save confirmation**
   - Submit updates fragment in DB.
   - UI updates immediately (no reload needed).
   - Toast message: "Fragment updated".

4. **Cancel**
   - Esc key or "Cancel" button discards changes.
   - Original values remain unchanged.

5. **Deletion during editing**
   - Delete button still works while in edit mode.
   - Deleting clears the form without saving.

6. **API**
   - `PATCH /api/knowledge/fragments/:fragmentId` → updates fragment (only provided fields).
   - Request body shape: `{ context?: string; content?: string; tags?: string[] }`.

7. **Episode support**
   - Edit UI appears identically for fragments from articles and episodes.
   - No special handling for episode metadata.

## Implementation notes

- **Inline editing**: Modify existing fragment card component to toggle between display/edit mode.
- **Tag normalization**: Reuse same normalization logic as creation (lowercase, trim, dedupe).
- **Optimistic update**: Use Vue reactivity to show updated values before server confirms (reduce perceived latency).

## Links

- Depends on: `knowledge-base-textwork.md` (Package 1)
- Precedes: `knowledge-base-connections.md` (Package 2)

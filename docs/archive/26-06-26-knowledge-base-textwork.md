# Package: Knowledge Base — Text Work (Phase 1)

## Status

Done — completed in PR #71 as ReadingNote-based text work for articles and episodes.

## Goal

Users can create reading notes from articles/episodes, tag them, view them inline, and delete them. This is the first package in the Knowledge Base series - it establishes the core "text work" workflow.

## Non-goals

- LLM-assisted extraction (auto-suggest quotes/summaries).
- Topic map visualization (graph view of connections).
- Editing reading notes (editing is Package 1.5).
- Sharing reading notes with other users.
- Real-time collaboration or history.

## Product insight: Reading notes

Use **Lesenotiz** in the German user interface and **ReadingNote** in the domain instead of "Wissensfragment" / `KnowledgeFragment`.

A reading note is a source-bound result of working with a text. It retains its connection to the article or episode and may be one of these types:

- **Zitat** (`quote`): text taken verbatim from the source.
- **Zusammenfassung** (`summary`): the user's condensed account of a selected passage.
- **Eigene Notiz** (`note`): a personal thought, question, interpretation, or reflection.

This terminology deliberately distinguishes the current text-work stage from a later, independent knowledge note. A quote or spontaneous annotation is not necessarily established knowledge yet. It may become an autonomous and connected knowledge note through later processing.

Terminology to use:

- UI collection: **Lesenotizen**
- UI singular: **Lesenotiz**
- Domain entity: `ReadingNote`
- Domain types: `quote`, `summary`, `note`
- Source-bound text position: annotation or anchor, but not the name of the whole entity
- Future independently formulated and connected entity: **Wissensnotiz** / `KnowledgeNote`

User-facing actions should describe the activity where possible:

- **Als Zitat übernehmen**
- **Zusammenfassen**
- **Gedanken notieren**

Existing `KnowledgeFragment`, `FragmentType`, API, route, component, composable, test, and translation names should be migrated to the new terminology as part of this package. Because this package has not shipped yet, the physical schema should also use the final terminology: `reading_notes` and `ReadingNoteType`.

## Dependencies

- Existing `KnowledgeInboxItem` model (for article/episode access via `articleId`/`episodeId`).
- Current article/episode reader pages (`/articles/[id]`, `/episodes/[id]`).
- `UserTagEngagement` pattern (for tag index inspiration, not shared schema).

## Acceptance criteria

1. **Text selection UI**
   - When user selects text in article/episode reader, a floating toolbar appears.
   - Toolbar buttons: "Extract Quote", "Summarize Section", "Add Note".
   - Deselecting text hides the toolbar (no action required on unselect).

2. **Reading-note creation dialog**
   - Each toolbar button opens the same modal with fields:
     - `context` (optional, e.g., "Introduction", "Chapter 3").
     - `content` (pre-filled with selected text, editable).
     - `tags` (free text input, comma-separated, normalized: lowercase, trim, dedupe).
   - Submit creates a `ReadingNote` record in DB.

3. **Inline display**
   - Reading notes appear below article/episode content in three collapsible sections:
     - "Quotes" (shows extracted quotes).
     - "Summaries" (shows section summaries).
     - "Notes" (shows personal notes).
   - Each reading-note card shows:
     - `context` (if provided).
     - `content` (the extracted text).
     - `tags` (as clickable chips).
     - Delete button (trash icon, no confirmation dialog — mistake-friendly).

4. **Tag index page**
   - New route `/knowledge/tags`.
   - Lists all user tags sorted by usage (most frequent first).
   - Each row shows: tag name, count of reading notes using it.
   - Click a tag -> navigates to `/knowledge/reading-notes?tag=xxx`.

5. **Tag filtering**
   - Route `/knowledge/reading-notes?tag=xxx` displays only reading notes containing that tag.
   - Filtered view shows same reading-note card UI as inline view.
   - No tag filter shows all reading notes.

6. **Deletion**
   - Delete button on reading-note card removes it from DB and UI immediately.
   - No confirmation dialog.
   - Deletion of one reading note does not affect others.

7. **API endpoints**
   - `POST /api/knowledge/reading-notes`
     - Request body: `{ articleId?: string; episodeId?: string; type: 'quote'|'summary'|'note'; content: string; context?: string; tags?: string[] }`
     - Returns: created `ReadingNote`.
     - Requires `articleId` or `episodeId`.
   - `GET /api/knowledge/reading-notes?articleId=xxx`
     - Returns: array of reading notes for the article.
   - `GET /api/knowledge/reading-notes?episodeId=xxx`
     - Returns: array of reading notes for the episode.
   - `DELETE /api/knowledge/reading-notes/:readingNoteId`
     - Returns: 204 No Content.
   - `GET /api/knowledge/tags`
     - Returns: `[{ tag: string; count: number }]` sorted by count descending.

8. **Episode support**
   - Works identically for episodes.
   - Supports `rawMarkdown`, `shownotesMd`, `transcriptMd`.
   - `contentKind` in `ReadingNote` (article/episode) inferred from `articleId` vs `episodeId`.
   - Reading notes are scoped to the concrete content source (`body`, `shownotes`, `transcript`).

## Implementation notes

- **Text selection**: Use `window.getSelection().toString()` in reader Vue component; calculate selection coordinates for toolbar positioning.
- **Floating toolbar**: Fixed-position toolbar near the selected text; it appears on `pointerup`/`mouseup` after selection finishes and remains clickable.
- **Tag normalization**: Shared utility (`utils/reading-note-tags.ts`):
  - Split by comma.
  - Trim whitespace.
  - Convert to lowercase.
  - Filter empty strings.
  - Deduplicate.
- **Tag index query**: `SELECT tags unnest, count(*) FROM reading_notes WHERE user_id = ? GROUP BY tags` (PostgreSQL).
- **Inline display component**: `AnnotatableText.vue` embeds selection, highlighting, creation, grouped inline reading notes, and source-scoped loading.
- **Styling**: Use existing card panel styles (`infl0-panel`), tag chips from `UserTagEngagement` components.

## Review TODOs

### UX direction

- [x] Keep article and episode details as complete, calm reading views; do not permanently remove teaser, summary, chapters, or other existing content.
- [x] Make text work discoverable in the standard view with a short instruction near the text.
- [x] Allow text selection and reading-note creation directly in the standard view without requiring a mode change.
- [x] Add an optional "Learning focus" mode within the same page instead of introducing a separate text-work route.
- [x] In learning focus, reduce or collapse secondary metadata and navigation while retaining title, source/author, and the link to the original.
- [x] Make learning focus reversible without losing the reading position, draft reading note, or created reading notes.
- [x] Give learning focus a visible working state, including reading-note count, guidance for the next action, and a clear way to leave the mode.

### Reading-note creation

- [x] Change the selection toolbar so choosing quote, summary, or note opens the shared creation form instead of saving immediately.
- [x] Pre-fill the form with the selected text and keep the content editable.
- [x] Include optional context and comma-separated tags in the creation flow.
- [x] For summaries and notes, guide the user to formulate their own text while preserving the selected passage as the source anchor.
- [x] Normalize tags consistently: trim, lowercase, remove empty values, and deduplicate.
- [x] Preserve a draft when the user temporarily closes the form.

### Inline reading notes

- [x] Fix dynamically created highlight styling so persisted reading notes remain visibly highlighted after loading the page.
- [x] Restore highlights using the stored anchor offset instead of matching only the first occurrence of the text.
- [x] Support selections spanning multiple rendered Markdown text nodes.
- [x] Support overlapping reading-note anchors and highlight the full hovered/focused reading note even when anchors intersect.
- [x] Show quotes, summaries, and notes in three collapsible sections below the content.
- [x] Reuse one reading-note card presentation for inline sections, the global list, and filtered views.
- [x] Keep deletion mistake-friendly and immediately update both the highlight and reading-note lists.

### Article and episode coverage

- [x] Restore the article teaser and long summary in the standard reading view.
- [x] Restore episode chapters and their jump links in the standard reading view.
- [x] Support text work for episode `rawMarkdown`, `shownotesMd`, and `transcriptMd`.
- [x] Present episode text sources in the order content, shownotes, transcript.

### Navigation and accessibility

- [x] Make tag chips link to `/knowledge/reading-notes?tag=...`.
- [x] Make tag-index rows link to their filtered reading-note views and expose the tag index from the reading-note page.
- [x] Support keyboard-driven text work, including opening the toolbar/form, moving focus into it, submitting, cancelling, and returning focus.
- [x] Add appropriate toolbar/dialog semantics and make existing highlights keyboard-focusable.
- [x] Keep floating controls within the viewport on narrow screens and support pointer/touch selection where browsers expose it.

### Correctness and verification

- [x] Rename the active domain and implementation terminology from `KnowledgeFragment` to `ReadingNote`.
- [x] Squash branch-local Prisma migrations into one final `reading_notes` migration because `KnowledgeFragment` never shipped.
- [x] Restore the missing German `knowledgeInbox.title` translation.
- [x] Require exactly one of `articleId` or `episodeId` when creating a reading note.
- [x] Return HTTP 204 from successful reading-note deletion as specified.
- [x] Add component tests for creation submission, learning-focus transitions, highlight visibility, and repeated anchor text.
- [x] Add component coverage for keyboard focus through selection toolbar, editor cancellation, and highlight popovers.
- [x] Extend BDD tasks to complete the creation dialog and verify the resulting visible highlights and reading-note cards.
- [x] Add BDD coverage for learning focus and overlapping reading-note anchors.
- [x] Remove temporary debug scripts.
- [x] Resolve `git diff --check` findings before completing the package.

### Visual QA follow-up

- [x] Fix low-contrast global link hover styling in knowledge views.
- [x] Keep episode chapter numbering inside the chapter panel.
- [x] Strengthen learning focus visually, scroll to text work on entry, and preserve the current text-work position on exit.
- [x] Make text-selection toolbar and reading-note popover opaque enough to read.
- [x] Ensure Escape closes the selection toolbar without reopening it while text is still selected.
- [x] Add episode-detail component coverage for chapter layout and learning-focus behavior.

## Database schema

```prisma
enum ReadingNoteType {
  quote      // Exact text extraction
  summary    // User-written summary of a section
  note       // Personal note, paraphrase, or reflection
}

model ReadingNote {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  articleId       String?  @map("article_id")
  episodeId       String?  @map("episode_id")
  contentSource   String   @default("body") @map("content_source")
  
  type            ReadingNoteType @default(note)
  content         String     @db.Text          // The actual text
  anchorText      String?    @map("anchor_text") @db.Text
  anchorStartOffset Int?     @map("anchor_start_offset")
  context         String?    @map("context")   // e.g. "Introduction", "Chapter 3"
  
  userTags        String[]   @map("user_tags") @default([])  // User-defined tags
  
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
    
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  article         Article?   @relation(fields: [articleId], references: [id], onDelete: Cascade)
  episode         Episode?   @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, type])
  @@index([userId, userTags], type: gin)  // PostgreSQL GIN index for efficient tag filtering
  @@map("reading_notes")
}
```

## Links

- PR: #71
- Precedes: `knowledge-base-editing.md` (Package 1.5), `knowledge-base-connections.md` (Package 2), `knowledge-base-learning.md` (Package 3), `knowledge-base-tags.md` (Package 4)

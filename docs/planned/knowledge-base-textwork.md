# Package: Knowledge Base — Text Work (Phase 1)

## Goal

Users can extract knowledge fragments from articles/episodes, tag them, view them inline, and delete them. This is the first package in the Knowledge Base series — it establishes the core "text work" workflow.

## Non-goals

- LLM-assisted extraction (auto-suggest quotes/summaries).
- Topic map visualization (graph view of connections).
- Editing fragments (editing is Package 1.5).
- Sharing fragments with other users.
- Real-time collaboration or history.

## Dependencies

- Existing `KnowledgeInboxItem` model (for article/episode access via `articleId`/`episodeId`).
- Current article/episode reader pages (`/articles/[id]`, `/episodes/[id]`).
- `UserTagEngagement` pattern (for tag index inspiration, not shared schema).

## Acceptance criteria

1. **Text selection UI**
   - When user selects text in article/episode reader, a floating toolbar appears.
   - Toolbar buttons: "Extract Quote", "Summarize Section", "Add Note".
   - Deselecting text hides the toolbar (no action required on unselect).

2. **Fragment creation modal**
   - Each toolbar button opens the same modal with fields:
     - `context` (optional, e.g., "Introduction", "Chapter 3").
     - `content` (pre-filled with selected text, editable).
     - `tags` (free text input, comma-separated, normalized: lowercase, trim, dedupe).
   - Submit creates `KnowledgeFragment` record in DB.

3. **Inline display**
   - Fragments appear below article/episode content in three collapsible sections:
     - "Quotes" (shows extracted quotes).
     - "Summaries" (shows section summaries).
     - "Notes" (shows personal notes).
   - Each fragment card shows:
     - `context` (if provided).
     - `content` (the extracted text).
     - `tags` (as clickable chips).
     - Delete button (trash icon, no confirmation dialog — mistake-friendly).

4. **Tag index page**
   - New route `/knowledge/tags`.
   - Lists all user tags sorted by usage (most frequent first).
   - Each row shows: tag name, count of fragments using it.
   - Click a tag → navigates to `/knowledge/fragments?tag=xxx`.

5. **Tag filtering**
   - Route `/knowledge/fragments?tag=xxx` displays only fragments containing that tag.
   - Filtered view shows same fragment card UI as inline view.
   - No tag filter shows all fragments (equivalent to viewing in article detail).

6. **Deletion**
   - Delete button on fragment card removes it from DB and UI immediately.
   - No confirmation dialog.
   - Deletion of one fragment does not affect others.

7. **API endpoints**
   - `POST /api/knowledge/fragments`
     - Request body: `{ articleId?: string; episodeId?: string; type: 'quote'|'summary'|'note'; content: string; context?: string; tags?: string[] }`
     - Returns: created `KnowledgeFragment`.
     - Requires `articleId` or `episodeId`.
   - `GET /api/knowledge/fragments?articleId=xxx`
     - Returns: array of fragments for the article.
   - `GET /api/knowledge/fragments?episodeId=xxx`
     - Returns: array of fragments for the episode.
   - `DELETE /api/knowledge/fragments/:fragmentId`
     - Returns: 204 No Content.
   - `GET /api/knowledge/tags`
     - Returns: `[{ tag: string; count: number }]` sorted by count descending.

8. **Episode support**
   - Works identically for episodes.
   - Supports `rawMarkdown`, `shownotesMd`, `transcriptMd`.
   - `contentKind` in `KnowledgeFragment` (article/episode) inferred from `articleId` vs `episodeId`.

## Implementation notes

- **Text selection**: Use `window.getSelection().toString()` in reader Vue component; calculate selection coordinates for toolbar positioning.
- **Floating toolbar**: Absolute positioned `div` with `pointer-events: none` to avoid interfering with selection; shows on `pointerup` (after selection finishes).
- **Tag normalization**: Shared utility (e.g., `utils/knowledge-tags.ts`):
  - Split by comma.
  - Trim whitespace.
  - Convert to lowercase.
  - Filter empty strings.
  - Deduplicate.
- **Tag index query**: `SELECT tags unnest, count(*) FROM knowledge_fragments WHERE user_id = ? GROUP BY tags` (PostgreSQL).
- **Inline display component**: `ArticleKnowledgeFragments.vue` and `EpisodeKnowledgeFragments.vue` — reused in their respective detail pages.
- **Styling**: Use existing card panel styles (`infl0-panel`), tag chips from `UserTagEngagement` components.

## Database schema

```prisma
enum FragmentType {
  quote      // Exact text extraction
  summary    // User-written summary of a section
  note       // Personal note, paraphrase, or reflection
}

model KnowledgeFragment {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  articleId       String?  @map("article_id")
  episodeId       String?  @map("episode_id")
  
  type            FragmentType @default(note)
  content         String     @db.Text          // The actual text
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
  @@map("knowledge_fragments")
}
```

## Links

- Precedes: `knowledge-base-editing.md` (Package 1.5), `knowledge-base-connections.md` (Package 2), `knowledge-base-learning.md` (Package 3), `knowledge-base-tags.md` (Package 4)

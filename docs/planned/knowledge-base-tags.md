# Package: Knowledge Base — Tags & Organization (Package 4)

## Goal

Improve tag management for knowledge fragments — smart suggestions, tag clouds, duplicate detection, and hierarchical organization. This package enhances the tagging experience introduced in Package 1.

## Non-goals

- Nested categories/folders (flat tag space only).
- Tag permissions or shared tags (user-private only).
- Automatic tag generation via LLM (may be added in a separate package).
- Tag grouping or tag bundles (one tag = one string).

## Dependencies

- Package 1 (Text Work): fragments with `userTags` field.
- ` UserTagEngagement` pattern (for inspiration, not shared schema).

## Acceptance criteria

1. **Tag index with stats**
   - `/knowledge/tags` shows all user tags sorted by usage frequency.
   - Each tag shows: name, count of fragments using it.
   - Sortable by: frequency (default), alphabetically.

2. **Tag suggestions**
   - When editing a fragment, typing in tag input shows suggestions:
     - Existing tags (user's tag index).
     - Article/episode tags (enrichment tags from source content).
   - Suggestions appear as user types (debounced, max 10 results).
   - Tag selection adds it to the input field.

3. **Tag cloud visualization**
   - `/knowledge/tags/cloud` shows tags with font size proportional to usage count.
   - Font scale: min (`0.8em`), max (`2.0em`) based on percentile.
   - Click a tag → filter view (`/knowledge/fragments?tag=xxx`).
   - Color: all same color (or subtle hue for hover).

4. **Tag merging**
   - On `/knowledge/tags`, tags with high similarity (e.g., "vue" vs "vuejs" vs "vue.js") show merge suggestions.
   - User clicks "Merge" → chooses canonical tag, migrates fragments, deletes duplicates.
   - Migration: UI shows fragments affected, user confirms.

5. **Tag hierarchy (optional, future)**
   - Parent/child relationships between tags (e.g., "vue" → "vue-router", "vue-composition-api").
   - Not required for first pass; may be deferred to Package 4.5.

6. **Bulk tag actions**
   - Bulk edit: select multiple fragments → apply tags to all.
   - Bulk remove: remove tag from selected fragments.

7. **Tag autocomplete**
   - Tag input field supports Tab to select first suggestion, Arrow keys to navigate.
   - Enter adds tag, comma also adds tag.

## Implementation notes

- **Tag similarity**: Use fuzzy match (e.g., `string-similarity` package) for merge suggestions.
- **Tag autocomplete**: Debounced API call to `/api/knowledge/tags/suggestions?query=xxx`.
- **Tag cloud calculation**: In `utils/tag-cloud.ts`, compute percentile-based font sizes.
- **Performance**: GIN index on `reading_notes.userTags` for fast filtering.

## API additions

- `GET /api/knowledge/tags/suggestions?query=xxx&limit=10`
  - Returns: `[{ tag: string; count: number; type: 'existing'|'articleTag'|'episodeTag' }]`
- `POST /api/knowledge/tags/merge`
  - Request body: `{ targetTag: string; mergeTags: string[] }`
  - Migrates fragments and removes duplicate tags.

## Links

- Depends on: `knowledge-base-textwork.md`
- Precedes: future tag hierarchy or tag bundles (Package 4.5+).

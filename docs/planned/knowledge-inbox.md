
# Feature: Capture & Knowledge Inbox

## Goal
Users can intentionally save interesting articles into a personal knowledge inbox to find and process them later in a focused environment. This serves as the first step toward building a personal knowledge base within infl0.

## Non-Goals
- No automatic AI summarization (in v1).
- No complex folder structures or categories.
- No global full-text search across the inbox.
- No import/export of external knowledge systems.
- No gamification elements (streaks, etc.).

## User Experience & UI Design

### 1. Capture Action (Timeline/Reader)
- A subtle button or menu item "Save to knowledge inbox" allows marking an article for later.
- Once saved, the state is visually indicated ("Saved").
- The action does not interrupt the reading flow (calm confirmation, no blocking dialogs).

### 2. Browsing View (`/knowledge/inbox`)
The inbox is explicitly **not** a card view like the timeline, but an optimized list for quick scanning:
- **Layout:** Compact list format.
- **Content per entry:** 
  - Article title (prominent).
  - Source/Feed (subtle).
  - Capture timestamp (`capturedAt`).
  - A short teaser/snippet from the text for rapid orientation.
- **Ordering:** Strictly chronological, newest entries first.
- **Typography:** Respects the user's chosen theme fonts from settings.

### 3. Navigation to Detail
- Clicking an item in the list returns the user to the familiar **Detail Card View** (Reader mode) of that article.

## Data Model & Provenance
To ensure stability and provenance, a metadata snapshot is created upon saving (`KnowledgeInboxItem`):

- `id`: Unique ID for the inbox entry.
- `userId`: Link to the user.
- `articleId`: Reference to the original article.
- `capturedAt`: Timestamp (for chronological sorting).
- **Snapshot Provenance:**
  - `title_snapshot`: Title at the moment of saving.
  - `source_snapshot`: Source name at the moment of saving.
  - `teaser_snapshot`: A short text excerpt (~150-200 characters).

## Acceptance Criteria
1. Articles can be saved to the knowledge inbox via an intentional user action.
2. The route `/knowledge/inbox` displays all saved articles in reverse chronological order.
3. The list view includes teasers for quick content identification.
4. Clicking a list item opens the article in Reader mode.
5. Articles can be removed from the inbox without deleting the original article object.
6. The UI adheres to the user's theme font settings.
7. Functionality remains consistent when multiple items are saved (no index errors, correct ordering).

## Definition of Done
- [x] Documentation in `docs/planned/` drafted.
- [x] Feature file created with the Screenplay pattern.
- [x] API endpoints for Save/List/Delete defined and implemented.
- [x] UI for compact list view implemented.
- [x] Integration of theme fonts uses the existing app surfaces.
- [x] Stable article detail page verified in BDD.
- [ ] Episode detail navigation decided and implemented.
- [ ] BDD tests pass in CI/local runs.

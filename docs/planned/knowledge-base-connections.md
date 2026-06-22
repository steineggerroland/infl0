# Package: Knowledge Base — Connections (Package 2)

## Goal

Users can visualize and manage connections between knowledge fragments — see how their extracted quotes, summaries, and notes relate to each other, especially across different articles.

## Non-goals

- Real-time or collaborative connections (multi-user editing).
- Automatic connection discovery (no AI or pattern mining).
- Tag-based connections (tagging is handled in Package 4).
- Versioning of connections (simple create/delete only).

## Dependencies

- Package 1 (Text Work): fragments must exist before linking.
- Package 1.5 (Editing): optional — edit connection metadata in future.
- `reading_notes` table (schema in Package 1).

## Acceptance criteria

1. **Connection visualization**
   - New route `/knowledge/graph` displays fragments as nodes in a graph.
   - Nodes show: fragment type (icon or color), context, a snippet of content.
   - Edges show: connection type (`related`, `contradicts`, `builds_on`, `example_of`).
   - Graph is interactive (pan/zoom via standard library, e.g., `vue-3-graph` or `dagre-d3`).

2. **Add connection**
   - On fragment card, a "🔗 Connect" button opens a modal.
   - Modal shows:
     - Source fragment (current).
     - Target fragment (selector: dropdown of user's fragments, filtered by type).
     - Connection type (radio/selector: `related`, `contradicts`, `builds_on`, `example_of`).
   - Submit creates a `KnowledgeLink` record.

3. **Remove connection**
   - Existing edge on graph is clickable → shows connection metadata.
   - Click "Remove" to delete the connection.
   - Also possible from fragment card "Connections" section.

4. **Connection types**
   - `related`: Other fragment discusses similar topic (neutral).
   - `contradicts`: Other fragment presents opposing view (critical).
   - `builds_on`: Other fragment is a prerequisite or foundation.
   - `example_of`: Current fragment exemplifies a concept in the other.

5. **Filters**
   - Filter by fragment type (show only quotes, only summaries, etc.).
   - Filter by tag (show fragments containing tag, then their connections).
   - Highlight path: start from one fragment → show direct connections → show 2nd-degree connections.

6. **Smart suggestions (optional, not required for first pass)**
   - Auto-suggest links based on shared tags or keyword overlap.
   - User can accept/reject suggestions (explicit opt-in per link).

## Implementation notes

- **Graph library**: Choose lightweight Vue-compatible library (e.g., `vue-3-graph`, `cytoscape.js` with Vue wrapper).
- **node positions**: First pass: force-directed layout; later: user drag-to-reposition.
- **Connection metadata**: Store `linkType` in `KnowledgeLink` table.
- **Performance**: Lazy load connections for large user bases (pagination or virtualization).

## Database schema

```prisma
model KnowledgeLink {
  id                String   @id @default(uuid()) @db.Uuid
  fromFragmentId    String   @map("from_fragment_id")
  toFragmentId      String   @map("to_fragment_id")
  linkType          String   @db.VarChar(50) // e.g., "related", "contradicts", "builds_on", "example_of"
  createdAt         DateTime @default(now())
  
  fromFragment      KnowledgeFragment @relation(fields: [fromFragmentId], references: [id], onDelete: CASCADE)
  toFragment        KnowledgeFragment @relation(fields: [toFragmentId], references: [id], onDelete: CASCADE)
  
  @@unique([fromFragmentId, toFragmentId, linkType])
  @@index([fromFragmentId])
  @@index([toFragmentId])
  @@map("knowledge_links")
}
```

## Links

- Depends on: `knowledge-base-textwork.md`, `knowledge-base-editing.md`
- Precedes: `knowledge-base-learning.md` (learning can use connections for context).

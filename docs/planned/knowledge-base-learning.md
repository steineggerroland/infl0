# Package: Knowledge Base — Learning (Package 3)

## Goal

Enable users to recall and reinforce their knowledge using spaced repetition and active recall techniques. Build upon fragments (quotes, summaries, notes) to create a learning workflow with quiz-style review.

## Non-goals

- Full-course generation or certification.
- Group learning or social sharing.
- LLM-assisted extraction ( Package 1.5 or future separate package).
- Adaptive difficulty or AI-generated questions.

## Dependencies

- Package 1 (Text Work): fragments as the atomic learning units.
- Package 1.5 (Editing): optional — user may refine extracted text before learning.
- Package 2 (Connections): optional — connections provide context for retrieval.

## Acceptance criteria

1. **Review queue interface**
   - New route `/knowledge/review` shows fragments scheduled for review.
   - Fragments sorted by: `nextReviewAt` (earliest first).
   - Only show fragments with `nextReviewAt <= now()`.

2. **Quiz mode (active recall)**
   - Review page displays one fragment at a time.
   - Shows: `context`, `content` (hidden initially).
   - User sees prompt: "Can you recall what this means?" or "What tags would you assign?"
   - User clicks "Show answer" to reveal `content` and `tags`.
   - User self-assesses recall quality: "I forgot", "I was unsure", "I recalled it".

3. **Spaced repetition algorithm**
   - After review, algorithm calculates next review date based on recall quality:
     - Forgot → review in 10 minutes.
     - Unsure → review in 1 day.
     - Recalled → review in 3 days (start), then exponential increase.
   - Updates `KnowledgeReview` record with `nextReviewAt`.
   - Uses SM-2 algorithm (Simplified SuperMemo-2) or simplified version.

4. **Review stats**
   - Dashboard shows: total fragments, scheduled today, reviewed this week.
   - Chart: review history over time (fragments reviewed per day).
   - Accuracy metric: % of "Recalled" vs "Forgot" over last 30 days.

5. **KnowledgeReview schema**
   ```prisma
   model KnowledgeReview {
     id               String   @id @default(uuid()) @db.Uuid
     fragmentId       String   @map("fragment_id")
     userId           String   @map("user_id")
     reviewedAt       DateTime @default(now())
     recallQuality    Int      @map("recall_quality") // 0 (forgot) to 5 (perfect recall)
     nextReviewAt     DateTime @map("next_review_at")
     
     fragment         KnowledgeFragment @relation(fields: [fragmentId], references: [id])
     user             User @relation(fields: [userId], references: [id], onDelete: CASCADE)
     
     @@unique([fragmentId, reviewedAt])
     @@index([userId, nextReviewAt])
     @@map("knowledge_reviews")
   }
   ```

6. **Algorithm (SM-2 simplified)**
   - Initial interval: 1 day.
   - If quality = 0 (forgot): interval = 10 minutes, `nextReviewAt = now() + 10min`.
   - If quality = 3 (unsure): interval = 1 day, `nextReviewAt = now() + 1d`.
   - If quality = 5 (recalled): interval = 3 days, `nextReviewAt = now() + 3d`.
   - On subsequent reviews: interval = previous_interval * quality_factor (e.g., `1.3`), capped at `max_interval` (e.g., 365 days).

7. **Review notifications**
   - Daily summary: "You have X fragments due for review today."
   - Not real-time push (serverless-friendly: cron job or background worker).
   - Display in `/knowledge/review` and dashboard (future).

## Implementation notes

- **Review algorithm**: Implement as pure function in `utils/spaced-repetition.ts` (pure, testable).
- **Review session**: Simple sequential UI, no multi-fragment batching.
- **State persistence**: Update `KnowledgeReview` record on every review action.
- **Performance**: Use index on `nextReviewAt` for fast queue retrieval.
- **Testing**: Write unit tests for SM-2 algorithm with known inputs/outputs.

## Links

- Depends on: `knowledge-base-textwork.md`
- Precedes: future AI-assisted learning (Package 5).

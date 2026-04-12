-- AlterTable
ALTER TABLE "users" ADD COLUMN "timeline_score_prefs" JSONB;

-- AlterTable
ALTER TABLE "user_timeline_items" ADD COLUMN "rank_score" DOUBLE PRECISION,
ADD COLUMN "scored_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "user_timeline_items_user_id_rank_score_idx" ON "user_timeline_items"("user_id", "rank_score" DESC);

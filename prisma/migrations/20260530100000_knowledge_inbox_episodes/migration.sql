-- AlterTable: add content_kind, episode_id; make article_id nullable
ALTER TABLE "knowledge_inbox_items"
  ADD COLUMN "content_kind" "timeline_content_kind" NOT NULL DEFAULT 'article',
  ADD COLUMN "episode_id" TEXT,
  ALTER COLUMN "article_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_inbox_items_user_id_episode_id_key" ON "knowledge_inbox_items"("user_id", "episode_id");

-- AddForeignKey
ALTER TABLE "knowledge_inbox_items" ADD CONSTRAINT "knowledge_inbox_items_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

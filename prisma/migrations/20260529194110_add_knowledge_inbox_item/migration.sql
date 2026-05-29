-- AlterTable
ALTER TABLE "email_otps" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "knowledge_inbox_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "article_id" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title_snapshot" TEXT NOT NULL,
    "source_snapshot" TEXT NOT NULL,
    "teaser_snapshot" VARCHAR(500) NOT NULL,

    CONSTRAINT "knowledge_inbox_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_inbox_items_user_id_captured_at_idx" ON "knowledge_inbox_items"("user_id", "captured_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_inbox_items_user_id_article_id_key" ON "knowledge_inbox_items"("user_id", "article_id");

-- AddForeignKey
ALTER TABLE "knowledge_inbox_items" ADD CONSTRAINT "knowledge_inbox_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_inbox_items" ADD CONSTRAINT "knowledge_inbox_items_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "engagement_tracking_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "user_timeline_items" ADD COLUMN "engaged_seconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "read_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "article_engagement_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "article_id" TEXT NOT NULL,
    "segment" VARCHAR(16) NOT NULL,
    "duration_sec" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_engagement_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_engagement_events_user_id_article_id_idx" ON "article_engagement_events"("user_id", "article_id");

-- CreateIndex
CREATE INDEX "article_engagement_events_user_id_created_at_idx" ON "article_engagement_events"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "article_engagement_events" ADD CONSTRAINT "article_engagement_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_engagement_events" ADD CONSTRAINT "article_engagement_events_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

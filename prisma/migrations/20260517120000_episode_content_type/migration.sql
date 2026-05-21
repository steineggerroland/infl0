-- CreateEnum
CREATE TYPE "timeline_content_kind" AS ENUM ('article', 'episode');

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "crawl_key" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "published_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "content_hash" TEXT,
    "content_md" TEXT,
    "source_type" TEXT,
    "tld" TEXT,
    "categories" JSONB,
    "summary" TEXT,
    "shownotes_md" TEXT,
    "transcript_md" TEXT,
    "media_url" TEXT,
    "media_type" TEXT,
    "media_length_bytes" INTEGER,
    "duration_seconds" INTEGER,
    "episode_number" INTEGER,
    "season_number" INTEGER,
    "episode_type" TEXT,
    "explicit" TEXT,
    "subtitle" TEXT,
    "image_url" TEXT,
    "chapters_url" TEXT,
    "chapters_type" TEXT,
    "chapters" JSONB,
    "chapters_fetch_error" TEXT,
    "transcript_url" TEXT,
    "transcript_type" TEXT,
    "transcript_fetch_error" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_enrichments" (
    "id" UUID NOT NULL,
    "episode_id" TEXT NOT NULL,
    "teaser" TEXT,
    "summary_long" TEXT,
    "category" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seriousness_rating" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "episode_enrichments_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "user_timeline_items" ADD COLUMN "content_kind" "timeline_content_kind" NOT NULL DEFAULT 'article',
ADD COLUMN "episode_id" TEXT;

ALTER TABLE "user_timeline_items" ALTER COLUMN "article_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "episodes_crawl_key_idx" ON "episodes"("crawl_key");

-- CreateIndex
CREATE INDEX "episodes_published_at_idx" ON "episodes"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "episode_enrichments_episode_id_key" ON "episode_enrichments"("episode_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_timeline_items_user_id_episode_id_key" ON "user_timeline_items"("user_id", "episode_id");

-- AddCheckConstraint
ALTER TABLE "user_timeline_items" ADD CONSTRAINT "user_timeline_items_content_ref_check" CHECK (
    (
        "content_kind" = 'article'
        AND "article_id" IS NOT NULL
        AND "episode_id" IS NULL
    )
    OR
    (
        "content_kind" = 'episode'
        AND "episode_id" IS NOT NULL
        AND "article_id" IS NULL
    )
);

-- AddForeignKey
ALTER TABLE "episode_enrichments" ADD CONSTRAINT "episode_enrichments_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_timeline_items" ADD CONSTRAINT "user_timeline_items_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

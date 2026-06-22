-- CreateEnum
CREATE TYPE "ReadingNoteType" AS ENUM ('quote', 'summary', 'note');

-- CreateTable
CREATE TABLE "reading_notes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "article_id" TEXT,
    "episode_id" TEXT,
    "type" "ReadingNoteType" NOT NULL DEFAULT 'note',
    "content" TEXT NOT NULL,
    "context" TEXT,
    "user_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "anchor_text" TEXT,
    "anchor_start_offset" INTEGER,
    "content_source" TEXT NOT NULL DEFAULT 'body',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reading_notes_user_id_created_at_idx" ON "reading_notes"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reading_notes_user_id_type_idx" ON "reading_notes"("user_id", "type");

-- CreateIndex
CREATE INDEX "reading_notes_user_tags_idx" ON "reading_notes" USING GIN ("user_tags");

-- AddForeignKey
ALTER TABLE "reading_notes" ADD CONSTRAINT "reading_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_notes" ADD CONSTRAINT "reading_notes_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_notes" ADD CONSTRAINT "reading_notes_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

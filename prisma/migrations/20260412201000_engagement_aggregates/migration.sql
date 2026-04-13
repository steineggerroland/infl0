-- CreateTable
CREATE TABLE "user_feed_engagement" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "crawl_key" TEXT NOT NULL,
    "last_article_id" TEXT,
    "pos_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "neg_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feed_engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_category_engagement" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" VARCHAR(200) NOT NULL,
    "pos_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "neg_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_category_engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tag_engagement" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tag" VARCHAR(200) NOT NULL,
    "pos_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "neg_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tag_engagement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_feed_engagement_user_id_crawl_key_key" ON "user_feed_engagement"("user_id", "crawl_key");

-- CreateIndex
CREATE INDEX "user_feed_engagement_user_id_idx" ON "user_feed_engagement"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_category_engagement_user_id_category_key" ON "user_category_engagement"("user_id", "category");

-- CreateIndex
CREATE INDEX "user_category_engagement_user_id_idx" ON "user_category_engagement"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_tag_engagement_user_id_tag_key" ON "user_tag_engagement"("user_id", "tag");

-- CreateIndex
CREATE INDEX "user_tag_engagement_user_id_idx" ON "user_tag_engagement"("user_id");

-- AddForeignKey
ALTER TABLE "user_feed_engagement" ADD CONSTRAINT "user_feed_engagement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feed_engagement" ADD CONSTRAINT "user_feed_engagement_last_article_id_fkey" FOREIGN KEY ("last_article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_category_engagement" ADD CONSTRAINT "user_category_engagement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tag_engagement" ADD CONSTRAINT "user_tag_engagement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

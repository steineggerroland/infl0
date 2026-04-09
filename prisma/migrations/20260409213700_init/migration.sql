-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feeds" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "feed_url" TEXT NOT NULL,
    "crawl_key" TEXT NOT NULL,
    "display_title" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "crawl_key" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "published_at" TIMESTAMP(3),
    "content_hash" TEXT,
    "content_md" TEXT,
    "source_type" TEXT,
    "tld" TEXT,
    "categories" JSONB,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_enrichments" (
    "id" UUID NOT NULL,
    "article_id" TEXT NOT NULL,
    "teaser" TEXT,
    "summary_long" TEXT,
    "category" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seriousness_rating" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_enrichments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_timeline_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "article_id" TEXT NOT NULL,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_timeline_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_feeds_user_id_idx" ON "user_feeds"("user_id");

-- CreateIndex
CREATE INDEX "user_feeds_crawl_key_idx" ON "user_feeds"("crawl_key");

-- CreateIndex
CREATE INDEX "articles_crawl_key_idx" ON "articles"("crawl_key");

-- CreateIndex
CREATE INDEX "articles_published_at_idx" ON "articles"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "article_enrichments_article_id_key" ON "article_enrichments"("article_id");

-- CreateIndex
CREATE INDEX "user_timeline_items_user_id_inserted_at_idx" ON "user_timeline_items"("user_id", "inserted_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_timeline_items_user_id_article_id_key" ON "user_timeline_items"("user_id", "article_id");

-- AddForeignKey
ALTER TABLE "user_feeds" ADD CONSTRAINT "user_feeds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_enrichments" ADD CONSTRAINT "article_enrichments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_timeline_items" ADD CONSTRAINT "user_timeline_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_timeline_items" ADD CONSTRAINT "user_timeline_items_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

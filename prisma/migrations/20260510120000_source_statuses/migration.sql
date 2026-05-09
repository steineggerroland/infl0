-- Latest crawl / health snapshot per crawlKey (TopicKnowledgeCrawler → infl0).

CREATE TABLE "source_statuses" (
    "crawl_key" TEXT NOT NULL,
    "source_status" TEXT,
    "source_health_status" TEXT,
    "source_health_reason" TEXT,
    "source_health_json" JSONB,
    "operator_attention" BOOLEAN NOT NULL DEFAULT false,
    "operator_attention_reason" TEXT,
    "last_crawl_status" TEXT,
    "last_crawl_started_at" TIMESTAMP(3),
    "last_crawl_finished_at" TIMESTAMP(3),
    "next_allowed_crawl_at" TIMESTAMP(3),
    "last_successful_crawl_at" TIMESTAMP(3),
    "last_crawl_error" TEXT,
    "crawl_candidate_count" INTEGER,
    "crawl_skipped_count" INTEGER,
    "crawl_processed_count" INTEGER,
    "crawl_unchanged_count" INTEGER,
    "crawl_fetch_error_count" INTEGER,
    "crawl_llm_failed_count" INTEGER,
    "consecutive_error_count" INTEGER,
    "detected_policy" JSONB,
    "effective_policy" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_statuses_pkey" PRIMARY KEY ("crawl_key")
);

-- Append-only ingest request history for integrator / operator observability.
CREATE TABLE "crawler_ingest_requests" (
  "id" UUID NOT NULL,
  "endpoint" TEXT NOT NULL DEFAULT 'ingest',
  "status" TEXT NOT NULL,
  "http_status" INTEGER NOT NULL,
  "failure_category" TEXT,
  "failure_message" TEXT,
  "crawl_key" TEXT,
  "item_kind" TEXT,
  "content_id" TEXT,
  "articles_accepted" INTEGER NOT NULL DEFAULT 0,
  "episodes_accepted" INTEGER NOT NULL DEFAULT 0,
  "timeline_inserted" INTEGER NOT NULL DEFAULT 0,
  "subscribers_affected" INTEGER NOT NULL DEFAULT 0,
  "request_preview" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "crawler_ingest_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "crawler_ingest_requests_created_at_idx" ON "crawler_ingest_requests"("created_at" DESC);
CREATE INDEX "crawler_ingest_requests_status_created_at_idx" ON "crawler_ingest_requests"("status", "created_at" DESC);

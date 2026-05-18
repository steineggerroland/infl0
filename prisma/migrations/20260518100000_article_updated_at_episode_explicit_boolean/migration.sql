-- Article: store feed/item update time from crawler ingest (TKC `updatedAt`).
ALTER TABLE "articles" ADD COLUMN "updated_at" TIMESTAMP(3);

-- Episode: `explicit` is boolean internally; map legacy string values when present.
ALTER TABLE "episodes" ALTER COLUMN "explicit" TYPE BOOLEAN USING (
  CASE
    WHEN "explicit" IS NULL THEN NULL
    WHEN LOWER("explicit") IN ('yes', 'true', '1') THEN TRUE
    WHEN LOWER("explicit") IN ('no', 'false', '0') THEN FALSE
    ELSE NULL
  END
);

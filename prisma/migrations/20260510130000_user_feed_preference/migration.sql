-- Per-subscription explicit preference: -1..+1 in 0.25 steps.
-- Added to ranking score in `recomputeTimelineScoresForUser`.

ALTER TABLE "user_feeds"
ADD COLUMN "user_preference_weight" DOUBLE PRECISION NOT NULL DEFAULT 0;

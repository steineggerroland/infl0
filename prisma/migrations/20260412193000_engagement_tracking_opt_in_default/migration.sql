-- Opt-in: new accounts and column default are off; existing rows follow the same policy.
ALTER TABLE "users" ALTER COLUMN "engagement_tracking_enabled" SET DEFAULT false;
UPDATE "users" SET "engagement_tracking_enabled" = false;

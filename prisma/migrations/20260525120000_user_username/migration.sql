-- Add username as login identity; copy legacy email into username for existing users.

ALTER TABLE "users" ADD COLUMN "username" TEXT;

UPDATE "users"
SET "username" = LOWER(TRIM("email"))
WHERE "username" IS NULL AND "email" IS NOT NULL;

UPDATE "users"
SET "username" = LOWER(REPLACE("id"::text, '-', ''))
WHERE "username" IS NULL;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

DROP INDEX IF EXISTS "users_email_key";

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

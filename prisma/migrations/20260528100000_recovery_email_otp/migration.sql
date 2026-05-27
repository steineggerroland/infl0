ALTER TABLE "users"
ADD COLUMN "recovery_email_verified_at" TIMESTAMP(3);

CREATE TABLE "email_otps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "purpose" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_otps_email_purpose_created_at_idx"
ON "email_otps"("email", "purpose", "created_at" DESC);

CREATE INDEX "email_otps_expires_at_idx"
ON "email_otps"("expires_at");

CREATE INDEX "email_otps_user_id_idx"
ON "email_otps"("user_id");

ALTER TABLE "email_otps"
ADD CONSTRAINT "email_otps_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

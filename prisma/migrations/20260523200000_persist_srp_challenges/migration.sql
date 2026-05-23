-- Persist SRP challenge state so challenge/verify can cross serverless instances.
CREATE TABLE "srp_challenges" (
  "id" UUID NOT NULL,
  "serialized" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "srp_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "srp_challenges_expires_at_idx" ON "srp_challenges"("expires_at");

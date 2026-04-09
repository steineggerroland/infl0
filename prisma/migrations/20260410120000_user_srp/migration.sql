-- AlterTable
ALTER TABLE "users" ADD COLUMN     "srp_salt" TEXT,
ADD COLUMN     "srp_verifier" TEXT;

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "wiseEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "wiseSenderName" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "wiseSenderEmail" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "wiseSenderCountry" TEXT;

-- AlterTable customer_profiles
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "walletFeesVisible" BOOLEAN NOT NULL DEFAULT false;

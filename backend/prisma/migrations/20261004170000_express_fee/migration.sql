-- CreateEnum
CREATE TYPE "ExpressFeeMode" AS ENUM ('FOLLOW_HQ', 'CUSTOM', 'DISABLED');

-- AlterTable customer_profiles
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "expressFeeMode" "ExpressFeeMode" NOT NULL DEFAULT 'FOLLOW_HQ';
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "expressFeeConfig" JSONB;

-- AlterTable usdt_purchase_details
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "expressTier" TEXT;
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "expressFeeUsdtSnapshot" DECIMAL(18,8);
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "expressDueAt" TIMESTAMP(3);
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "expressPolicySnapshot" JSONB;
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "expressActualTier" TEXT;
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "expressFeeSettledUsdt" DECIMAL(18,8);
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "expressSlaMet" BOOLEAN;
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "expressElapsedHours" DECIMAL(12,4);

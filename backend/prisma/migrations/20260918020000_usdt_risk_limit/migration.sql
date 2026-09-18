-- AlterTable: USDT risk limit (LR/MR/HR/XR/SR/ML)
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "usdtRiskLimitCode" TEXT NOT NULL DEFAULT 'MR';
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "usdtLimitMinUsdt" DOUBLE PRECISION;
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "usdtLimitMaxUsdt" DOUBLE PRECISION;

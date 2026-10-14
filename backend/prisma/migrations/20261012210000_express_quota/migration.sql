-- 유료회원 EXPRESS 티어별 기간 총 무료 횟수
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "expressQuotaGranted" JSONB;
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "expressQuotaRemaining" JSONB;

ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "expressQuotaUsed" BOOLEAN NOT NULL DEFAULT false;

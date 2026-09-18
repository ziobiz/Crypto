-- USDT 견적 대기/확정 상태 + 견적 스케줄 필드
ALTER TYPE "UsdtPurchaseStatus" ADD VALUE IF NOT EXISTS 'QUOTE_PENDING';
ALTER TYPE "UsdtPurchaseStatus" ADD VALUE IF NOT EXISTS 'QUOTE_CONFIRMED';

ALTER TABLE "usdt_purchase_details"
  ADD COLUMN IF NOT EXISTS "quoteMode" TEXT,
  ADD COLUMN IF NOT EXISTS "quoteDueAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "quoteConfirmedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "confirmedFiatAmount" DECIMAL(18, 2),
  ADD COLUMN IF NOT EXISTS "confirmedUsdtAmount" DECIMAL(18, 8);

CREATE INDEX IF NOT EXISTS "usdt_purchase_details_quoteDueAt_idx"
  ON "usdt_purchase_details"("quoteDueAt");

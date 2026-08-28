-- CURFEX webhook / auto deposit detection
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "curfexDepositDetectedAt" TIMESTAMP(3);
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "curfexLastEventJson" JSONB;
CREATE INDEX IF NOT EXISTS "usdt_purchase_details_curfexRefNo_idx" ON "usdt_purchase_details"("curfexRefNo");

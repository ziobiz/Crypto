-- CURFEX/Fukugu Collection fields on USDT purchase (optional additive)
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "collectionProvider" TEXT;
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "curfexRefNo" TEXT;
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "curfexStatusCode" TEXT;
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "collectionAccountJson" JSONB;

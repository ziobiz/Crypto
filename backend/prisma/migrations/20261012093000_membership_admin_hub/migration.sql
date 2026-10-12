-- Membership admin hub: REFUNDED status + crypto slots + admin notes
DO $$ BEGIN
  ALTER TYPE "MembershipOrderStatus" ADD VALUE 'REFUNDED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "membership_orders" ADD COLUMN IF NOT EXISTS "cryptoAsset" TEXT;
ALTER TABLE "membership_orders" ADD COLUMN IF NOT EXISTS "cryptoNetwork" TEXT;
ALTER TABLE "membership_orders" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "membership_orders" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);
ALTER TABLE "membership_orders" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;

CREATE INDEX IF NOT EXISTS "membership_orders_payMeans_createdAt_idx" ON "membership_orders"("payMeans", "createdAt");
CREATE INDEX IF NOT EXISTS "membership_orders_paidAt_idx" ON "membership_orders"("paidAt");

-- AlterEnum
ALTER TYPE "TradeEscrowStatus" ADD VALUE IF NOT EXISTS 'SHIPPING_STARTED';
ALTER TYPE "TradeEscrowStatus" ADD VALUE IF NOT EXISTS 'PAYOUT_SCHEDULED';
ALTER TYPE "TradeEscrowStatus" ADD VALUE IF NOT EXISTS 'VOIDED';

DO $$ BEGIN
  CREATE TYPE "EscrowTradeTier" AS ENUM ('PREMIUM', 'STANDARD', 'CAUTION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "tradeTier" "EscrowTradeTier" NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "requiresReview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "initiatedByUserId" TEXT;
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "initiatedAsRole" TEXT;
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "escrowTerms" TEXT;
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "payoutScheduledAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "payoutProcessedAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "buyerAcceptedAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "buyerDisclaimerAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "sellerDisclaimerAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "acceptanceDeadlineAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "voidReason" TEXT;
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "shippingStartedAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "retryParentTicketId" TEXT;
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;

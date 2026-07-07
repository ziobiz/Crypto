-- AlterEnum
ALTER TYPE "TradeEscrowStatus" ADD VALUE IF NOT EXISTS 'SELLER_ACCEPTED';
ALTER TYPE "TradeEscrowStatus" ADD VALUE IF NOT EXISTS 'CONTRACT_CONFIRMED';

-- AlterTable
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "sellerAcceptedAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "buyerContractConfirmedAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "sellerContractConfirmedAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "deliveryTerms" TEXT;
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "deliveryDeadline" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "depositDeadlineAt" TIMESTAMP(3);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "depositorName" TEXT;
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "depositAmount" DECIMAL(18,2);
ALTER TABLE "trade_escrow_details" ADD COLUMN IF NOT EXISTS "depositTransferredAt" TIMESTAMP(3);

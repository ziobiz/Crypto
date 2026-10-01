-- AlterEnum
CREATE TYPE "TradeReceiptUiMode" AS ENUM ('FOLLOW_HQ', 'ENABLED', 'DISABLED');

-- AlterTable
ALTER TABLE "customer_profiles"
  ADD COLUMN "tradeReceiptAdminUiMode" "TradeReceiptUiMode" NOT NULL DEFAULT 'FOLLOW_HQ',
  ADD COLUMN "tradeReceiptMerchantUiMode" "TradeReceiptUiMode" NOT NULL DEFAULT 'FOLLOW_HQ';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TradeReceiptEmailMode" AS ENUM ('FOLLOW_HQ', 'ENABLED', 'DISABLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TradeReceiptSendStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "customer_profiles"
  ADD COLUMN IF NOT EXISTS "tradeReceiptEmailMode" "TradeReceiptEmailMode" NOT NULL DEFAULT 'FOLLOW_HQ';

-- CreateTable
CREATE TABLE IF NOT EXISTS "trade_receipt_email_logs" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT,
    "ticketNo" TEXT NOT NULL,
    "ticketType" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "status" "TradeReceiptSendStatus" NOT NULL,
    "skipReason" TEXT,
    "errorMessage" TEXT,
    "customerProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_receipt_email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "trade_receipt_email_logs_createdAt_idx" ON "trade_receipt_email_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "trade_receipt_email_logs_ticketNo_idx" ON "trade_receipt_email_logs"("ticketNo");
CREATE INDEX IF NOT EXISTS "trade_receipt_email_logs_ticketId_idx" ON "trade_receipt_email_logs"("ticketId");
CREATE INDEX IF NOT EXISTS "trade_receipt_email_logs_status_idx" ON "trade_receipt_email_logs"("status");
CREATE INDEX IF NOT EXISTS "trade_receipt_email_logs_customerProfileId_idx" ON "trade_receipt_email_logs"("customerProfileId");

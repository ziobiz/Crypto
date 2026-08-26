-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ORGANIZER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SETTLEMENT_ADMIN';

-- AlterTable
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "brokerUsdtAmount" DECIMAL(18,8);

-- CreateTable
CREATE TABLE IF NOT EXISTS "cost_analyses" (
    "id" TEXT NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "depositFiat" DECIMAL(18,2) NOT NULL,
    "receivedUsdt" DECIMAL(18,8) NOT NULL,
    "exchangeRate" DECIMAL(18,8) NOT NULL,
    "exchangeRateAt" TIMESTAMP(3) NOT NULL,
    "exchangeSource" TEXT NOT NULL,
    "correctionUsdt" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "gasFeeUsdt" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "feeUsdt" DECIMAL(18,8) NOT NULL,
    "grossUsdt" DECIMAL(18,8) NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_analyses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "cost_analyses_createdAt_idx" ON "cost_analyses"("createdAt");

ALTER TABLE "cost_analyses" DROP CONSTRAINT IF EXISTS "cost_analyses_createdById_fkey";
ALTER TABLE "cost_analyses" ADD CONSTRAINT "cost_analyses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterEnum
DO $$ BEGIN
  CREATE TYPE "UsdtQuoteResponseMode" AS ENUM ('FOLLOW_HQ', 'AUTO', 'MANUAL', 'OFF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "usdtQuoteResponseMode" "UsdtQuoteResponseMode" NOT NULL DEFAULT 'FOLLOW_HQ';
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "usdtQuoteAutoDelayMinutes" INTEGER;
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "usdtQuoteManualSlaHours" INTEGER;

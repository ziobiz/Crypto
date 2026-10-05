-- CreateEnum
CREATE TYPE "UsdtPayMethodAccess" AS ENUM ('FOLLOW_HQ', 'ENABLED', 'DISABLED');

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN "usdtPayBankMode" "UsdtPayMethodAccess" NOT NULL DEFAULT 'FOLLOW_HQ';
ALTER TABLE "customer_profiles" ADD COLUMN "usdtPayRemittanceMode" "UsdtPayMethodAccess" NOT NULL DEFAULT 'FOLLOW_HQ';
ALTER TABLE "customer_profiles" ADD COLUMN "usdtPayCardMode" "UsdtPayMethodAccess" NOT NULL DEFAULT 'FOLLOW_HQ';

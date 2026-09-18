-- CreateEnum
CREATE TYPE "TotalFeeVisibility" AS ENUM ('FOLLOW_HQ', 'SHOW', 'HIDE');

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "totalFeeVisibility" "TotalFeeVisibility" NOT NULL DEFAULT 'FOLLOW_HQ';

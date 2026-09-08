-- CreateEnum
CREATE TYPE "FeeBillingMethod" AS ENUM ('FOLLOW_HQ', 'INTEGRATED', 'ITEMIZED', 'HYBRID');

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN "feeBillingMethod" "FeeBillingMethod" NOT NULL DEFAULT 'FOLLOW_HQ';

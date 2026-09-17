-- CreateEnum
CREATE TYPE "UsdtCollectionMode" AS ENUM ('FOLLOW_HQ', 'FIXED', 'VIRTUAL');

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN "usdtCollectionMode" "UsdtCollectionMode" NOT NULL DEFAULT 'FOLLOW_HQ';

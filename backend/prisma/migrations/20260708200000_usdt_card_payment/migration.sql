-- CreateEnum
CREATE TYPE "UsdtPaymentMethod" AS ENUM ('BANK_TRANSFER', 'CARD');

-- CreateEnum
CREATE TYPE "CardPaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- AlterEnum
ALTER TYPE "UsdtPurchaseStatus" ADD VALUE IF NOT EXISTS 'CARD_PAYMENT_PENDING';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "phoneCountryCode" TEXT;

-- AlterTable
ALTER TABLE "usdt_purchase_details" ADD COLUMN "paymentMethod" "UsdtPaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
ADD COLUMN "cardFeePercentSnapshot" DECIMAL(5,4),
ADD COLUMN "cardFeeFiatSnapshot" DECIMAL(18,2),
ADD COLUMN "cardChargeFiat" DECIMAL(18,2),
ADD COLUMN "cardPaymentStatus" "CardPaymentStatus",
ADD COLUMN "cardWaiverAcceptedAt" TIMESTAMP(3),
ADD COLUMN "icopayOrderId" TEXT,
ADD COLUMN "icopayTransactionId" TEXT,
ADD COLUMN "cardLast4" TEXT;

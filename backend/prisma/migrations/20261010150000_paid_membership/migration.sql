-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "paidMemberUntil" TIMESTAMP(3);
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "paidMemberSource" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_profiles_paidMemberUntil_idx" ON "customer_profiles"("paidMemberUntil");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MembershipOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MembershipPayMeans" AS ENUM ('CARD', 'CRYPTO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "membership_orders" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "customerProfileId" TEXT NOT NULL,
    "customerType" "CustomerType" NOT NULL,
    "grade" "MemberGrade" NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "payMeans" "MembershipPayMeans" NOT NULL DEFAULT 'CARD',
    "status" "MembershipOrderStatus" NOT NULL DEFAULT 'PENDING',
    "icopayOrderId" TEXT,
    "icopaySessionId" TEXT,
    "icopayPayUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "failReason" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "membership_orders_orderNo_key" ON "membership_orders"("orderNo");
CREATE INDEX IF NOT EXISTS "membership_orders_customerProfileId_status_idx" ON "membership_orders"("customerProfileId", "status");
CREATE INDEX IF NOT EXISTS "membership_orders_icopayOrderId_idx" ON "membership_orders"("icopayOrderId");
CREATE INDEX IF NOT EXISTS "membership_orders_status_createdAt_idx" ON "membership_orders"("status", "createdAt");

DO $$ BEGIN
  ALTER TABLE "membership_orders" ADD CONSTRAINT "membership_orders_customerProfileId_fkey"
    FOREIGN KEY ("customerProfileId") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

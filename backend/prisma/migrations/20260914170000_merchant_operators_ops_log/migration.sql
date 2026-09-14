-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CUSTOMER_OPERATOR';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "WalletApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "merchantAdminUserId" TEXT;

CREATE INDEX IF NOT EXISTS "users_merchantAdminUserId_idx" ON "users"("merchantAdminUserId");

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_merchantAdminUserId_fkey"
    FOREIGN KEY ("merchantAdminUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable customer_profiles
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "operatorsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable wallets
ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "hqRegistered" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "approvalStatus" "WalletApprovalStatus" NOT NULL DEFAULT 'APPROVED';

-- Existing default wallets were HQ-registered at customer create
UPDATE "wallets" SET "hqRegistered" = true, "approvalStatus" = 'APPROVED' WHERE "isDefault" = true;

-- CreateTable merchant_operation_logs
CREATE TABLE IF NOT EXISTS "merchant_operation_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "merchantAdminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "otpVerified" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "merchant_operation_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "merchant_operation_logs_merchantAdminUserId_createdAt_idx"
  ON "merchant_operation_logs"("merchantAdminUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "merchant_operation_logs_actorId_idx"
  ON "merchant_operation_logs"("actorId");
CREATE INDEX IF NOT EXISTS "merchant_operation_logs_entityType_idx"
  ON "merchant_operation_logs"("entityType");
CREATE INDEX IF NOT EXISTS "merchant_operation_logs_createdAt_idx"
  ON "merchant_operation_logs"("createdAt");

DO $$ BEGIN
  ALTER TABLE "merchant_operation_logs" ADD CONSTRAINT "merchant_operation_logs_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "merchant_operation_logs" ADD CONSTRAINT "merchant_operation_logs_merchantAdminUserId_fkey"
    FOREIGN KEY ("merchantAdminUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

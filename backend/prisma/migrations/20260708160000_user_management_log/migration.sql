-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "UserManagementAction" AS ENUM ('REGISTER', 'ACTIVATE', 'DEACTIVATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "registerReason" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_management_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "UserManagementAction" NOT NULL,
    "reason" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_management_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_management_logs_userId_createdAt_idx" ON "user_management_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "user_management_logs_changedById_idx" ON "user_management_logs"("changedById");

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_management_logs" ADD CONSTRAINT "user_management_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_management_logs" ADD CONSTRAINT "user_management_logs_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

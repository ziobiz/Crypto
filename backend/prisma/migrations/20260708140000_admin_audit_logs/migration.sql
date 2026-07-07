-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AdminChangeAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "admin_change_logs" (
    "id" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "action" "AdminChangeAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityLabel" TEXT,
    "summary" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_change_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "platform_release_logs" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "packageSizeMb" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "recordedById" TEXT,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_release_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_change_logs_changedById_idx" ON "admin_change_logs"("changedById");
CREATE INDEX IF NOT EXISTS "admin_change_logs_entityType_idx" ON "admin_change_logs"("entityType");
CREATE INDEX IF NOT EXISTS "admin_change_logs_createdAt_idx" ON "admin_change_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "platform_release_logs_deployedAt_idx" ON "platform_release_logs"("deployedAt");

DO $$ BEGIN
  ALTER TABLE "admin_change_logs" ADD CONSTRAINT "admin_change_logs_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "platform_release_logs" ADD CONSTRAINT "platform_release_logs_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

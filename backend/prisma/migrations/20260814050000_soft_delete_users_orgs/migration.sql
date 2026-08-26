-- AlterEnum
DO $$ BEGIN
  ALTER TYPE "UserManagementAction" ADD VALUE IF NOT EXISTS 'DELETE';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "purgeAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "purgeAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "organizations_deletedAt_idx" ON "organizations"("deletedAt");
CREATE INDEX IF NOT EXISTS "organizations_purgeAt_idx" ON "organizations"("purgeAt");
CREATE INDEX IF NOT EXISTS "users_deletedAt_idx" ON "users"("deletedAt");
CREATE INDEX IF NOT EXISTS "users_purgeAt_idx" ON "users"("purgeAt");

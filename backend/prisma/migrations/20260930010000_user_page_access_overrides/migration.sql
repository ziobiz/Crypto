-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "page_access_overrides" JSONB;

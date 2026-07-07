-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReleaseChangeLevel" AS ENUM ('MAJOR', 'MINOR', 'PATCH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReleaseSource" AS ENUM ('AUTO', 'MANUAL', 'DEPLOY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "platform_release_logs" ADD COLUMN IF NOT EXISTS "titleI18n" JSONB;
ALTER TABLE "platform_release_logs" ADD COLUMN IF NOT EXISTS "descriptionI18n" JSONB;
ALTER TABLE "platform_release_logs" ADD COLUMN IF NOT EXISTS "entityType" TEXT;

DO $$ BEGIN
  ALTER TABLE "platform_release_logs" ADD COLUMN "changeLevel" "ReleaseChangeLevel" NOT NULL DEFAULT 'MINOR';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "platform_release_logs" ADD COLUMN "source" "ReleaseSource" NOT NULL DEFAULT 'AUTO';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

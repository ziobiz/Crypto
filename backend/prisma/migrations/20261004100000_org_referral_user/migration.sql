-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "referralUserId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "organizations_referralUserId_idx" ON "organizations"("referralUserId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_referralUserId_fkey'
  ) THEN
    ALTER TABLE "organizations"
      ADD CONSTRAINT "organizations_referralUserId_fkey"
      FOREIGN KEY ("referralUserId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

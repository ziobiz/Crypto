-- AlterTable
ALTER TABLE "customer_profiles"
  ADD COLUMN "expectedCompleteTier" TEXT NOT NULL DEFAULT 'REGULAR',
  ADD COLUMN "expectedCompleteCustomDays" INTEGER;

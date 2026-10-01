-- AlterTable
ALTER TABLE "customer_profiles"
  ADD COLUMN "expectedCompleteCardTier" TEXT NOT NULL DEFAULT 'REGULAR',
  ADD COLUMN "expectedCompleteCardCustomDays" INTEGER;

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "currency" "CurrencyCode" NOT NULL DEFAULT 'KRW';
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "branchName" TEXT;

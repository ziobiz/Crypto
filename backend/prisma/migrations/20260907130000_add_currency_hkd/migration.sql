-- AlterEnum: add HKD for USDT fiat settlement
DO $$ BEGIN
  ALTER TYPE "CurrencyCode" ADD VALUE 'HKD';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

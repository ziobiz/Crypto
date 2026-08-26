-- Widen org share percent (was Decimal(5,4) = max 9.9999%)
ALTER TABLE "commission_rates" ALTER COLUMN "ratePercent" TYPE DECIMAL(8,4);
ALTER TABLE "ledger_entries" ALTER COLUMN "ratePercent" TYPE DECIMAL(8,4);

ALTER TABLE "commission_rates" ADD COLUMN IF NOT EXISTS "perTicketUsdt" DECIMAL(18,8) NOT NULL DEFAULT 0;
ALTER TABLE "commission_rates" ADD COLUMN IF NOT EXISTS "useDefault" BOOLEAN NOT NULL DEFAULT true;

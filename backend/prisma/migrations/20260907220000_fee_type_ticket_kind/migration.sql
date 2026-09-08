-- Fee types are per ticket kind (USDT vs TRADE). Duplicate existing rows for TRADE.

ALTER TABLE "fee_type_templates" ADD COLUMN IF NOT EXISTS "ticketKind" TEXT;

UPDATE "fee_type_templates"
SET "ticketKind" = 'USDT_PURCHASE'
WHERE "ticketKind" IS NULL OR "ticketKind" = '';

ALTER TABLE "fee_type_templates" ALTER COLUMN "ticketKind" SET NOT NULL;
ALTER TABLE "fee_type_templates" ALTER COLUMN "ticketKind" SET DEFAULT 'USDT_PURCHASE';

-- Drop global unique on code (name varies by PG)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fee_type_templates_code_key'
  ) THEN
    ALTER TABLE "fee_type_templates" DROP CONSTRAINT "fee_type_templates_code_key";
  END IF;
END $$;

DROP INDEX IF EXISTS "fee_type_templates_code_key";

-- Duplicate each USDT type as TRADE twin (same code/name/config)
INSERT INTO "fee_type_templates" (
  "id", "ticketKind", "code", "name", "isDefault", "sortOrder", "config", "createdAt", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || t."id"),
  'TRADE_ESCROW',
  t."code",
  t."name",
  t."isDefault",
  t."sortOrder",
  t."config",
  NOW(),
  NOW()
FROM "fee_type_templates" t
WHERE t."ticketKind" = 'USDT_PURCHASE'
  AND NOT EXISTS (
    SELECT 1 FROM "fee_type_templates" x
    WHERE x."ticketKind" = 'TRADE_ESCROW' AND x."code" = t."code"
  );

CREATE UNIQUE INDEX IF NOT EXISTS "fee_type_templates_ticketKind_code_key"
  ON "fee_type_templates" ("ticketKind", "code");

CREATE INDEX IF NOT EXISTS "fee_type_templates_ticketKind_isDefault_idx"
  ON "fee_type_templates" ("ticketKind", "isDefault");

CREATE INDEX IF NOT EXISTS "fee_type_templates_ticketKind_sortOrder_idx"
  ON "fee_type_templates" ("ticketKind", "sortOrder");

-- HQ fee type templates + per-customer fee policies / history

CREATE TABLE IF NOT EXISTS "fee_type_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_type_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "fee_type_templates_code_key" ON "fee_type_templates"("code");
CREATE INDEX IF NOT EXISTS "fee_type_templates_isDefault_idx" ON "fee_type_templates"("isDefault");
CREATE INDEX IF NOT EXISTS "fee_type_templates_sortOrder_idx" ON "fee_type_templates"("sortOrder");

CREATE TABLE IF NOT EXISTS "customer_fee_policies" (
    "id" TEXT NOT NULL,
    "customerProfileId" TEXT NOT NULL,
    "ticketKind" TEXT NOT NULL,
    "feeTypeCode" TEXT NOT NULL,
    "feeTypeName" TEXT,
    "operatingPercent" DECIMAL(10,6) NOT NULL,
    "operatingFixedUsdt" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "shares" JSONB NOT NULL,
    "applyStartDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_fee_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "customer_fee_policies_customerProfileId_ticketKind_applyStartDate_idx"
  ON "customer_fee_policies"("customerProfileId", "ticketKind", "applyStartDate");
CREATE INDEX IF NOT EXISTS "customer_fee_policies_ticketKind_applyStartDate_idx"
  ON "customer_fee_policies"("ticketKind", "applyStartDate");

CREATE TABLE IF NOT EXISTS "customer_fee_histories" (
    "id" TEXT NOT NULL,
    "customerProfileId" TEXT NOT NULL,
    "ticketKind" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "feeTypeCode" TEXT,
    "applyStartDate" DATE,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_fee_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "customer_fee_histories_customerProfileId_ticketKind_createdAt_idx"
  ON "customer_fee_histories"("customerProfileId", "ticketKind", "createdAt");
CREATE INDEX IF NOT EXISTS "customer_fee_histories_createdAt_idx"
  ON "customer_fee_histories"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_fee_policies_customerProfileId_fkey'
  ) THEN
    ALTER TABLE "customer_fee_policies"
      ADD CONSTRAINT "customer_fee_policies_customerProfileId_fkey"
      FOREIGN KEY ("customerProfileId") REFERENCES "customer_profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_fee_histories_customerProfileId_fkey'
  ) THEN
    ALTER TABLE "customer_fee_histories"
      ADD CONSTRAINT "customer_fee_histories_customerProfileId_fkey"
      FOREIGN KEY ("customerProfileId") REFERENCES "customer_profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_fee_histories_changedByUserId_fkey'
  ) THEN
    ALTER TABLE "customer_fee_histories"
      ADD CONSTRAINT "customer_fee_histories_changedByUserId_fkey"
      FOREIGN KEY ("changedByUserId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

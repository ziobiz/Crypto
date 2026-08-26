-- Customer-level fee share (copied from HQ defaults at registration)
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "feeShare" JSONB;

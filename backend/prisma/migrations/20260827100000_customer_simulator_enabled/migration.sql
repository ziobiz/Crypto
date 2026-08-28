-- CustomerProfile: per-customer USDT simulator toggle (overrides HQ access matrix when false)
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "simulatorEnabled" BOOLEAN NOT NULL DEFAULT true;

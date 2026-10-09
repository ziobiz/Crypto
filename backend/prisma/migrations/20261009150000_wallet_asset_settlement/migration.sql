-- AlterEnum CurrencyCode +USDC
ALTER TYPE "CurrencyCode" ADD VALUE IF NOT EXISTS 'USDC';

-- CreateEnum WalletAssetType
DO $$ BEGIN
  CREATE TYPE "WalletAssetType" AS ENUM ('USDT', 'USDC');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable wallets: assetType
ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "assetType" "WalletAssetType" NOT NULL DEFAULT 'USDT';

-- Drop old unique (constraint and/or standalone unique index), add new unique including assetType
ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "wallets_userId_address_network_key";
DROP INDEX IF EXISTS "wallets_userId_address_network_key";
DO $$ BEGIN
  ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_address_network_assetType_key"
    UNIQUE ("userId", "address", "network", "assetType");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "wallets_userId_assetType_idx" ON "wallets"("userId", "assetType");

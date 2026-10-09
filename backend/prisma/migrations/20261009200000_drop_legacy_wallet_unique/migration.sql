-- Legacy unique index (userId, address, network) blocks USDT/USDC twin wallets.
-- New uniqueness is wallets_userId_address_network_assetType_key.
DROP INDEX IF EXISTS "wallets_userId_address_network_key";
ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "wallets_userId_address_network_key";

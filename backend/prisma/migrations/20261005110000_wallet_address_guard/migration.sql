-- 지갑 삭제 요청, 거래 수령주소 스냅샷, 승인 주소 이력
ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "deleteRequestedAt" TIMESTAMP(3);

ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "walletAddressSnapshot" TEXT;
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "walletNetworkSnapshot" TEXT;

UPDATE "usdt_purchase_details" AS d
SET "walletAddressSnapshot" = w."address",
    "walletNetworkSnapshot" = w."network"
FROM "wallets" AS w
WHERE d."walletId" = w."id"
  AND d."walletAddressSnapshot" IS NULL;

CREATE TABLE IF NOT EXISTS "wallet_address_approvals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_address_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "wallet_address_approvals_userId_address_network_key"
  ON "wallet_address_approvals"("userId", "address", "network");
CREATE INDEX IF NOT EXISTS "wallet_address_approvals_userId_idx"
  ON "wallet_address_approvals"("userId");

DO $$ BEGIN
  ALTER TABLE "wallet_address_approvals"
    ADD CONSTRAINT "wallet_address_approvals_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "wallet_address_approvals" ("id", "userId", "address", "network", "approvedAt")
SELECT
  'wa_' || substr(md5(w."userId" || '|' || upper(w."network") || '|' ||
    CASE
      WHEN upper(w."network") IN ('ERC20', 'BEP20', 'ETH', 'POLYGON') THEN lower(btrim(w."address"))
      ELSE btrim(w."address")
    END), 1, 24),
  w."userId",
  CASE
    WHEN upper(w."network") IN ('ERC20', 'BEP20', 'ETH', 'POLYGON') THEN lower(btrim(w."address"))
    ELSE btrim(w."address")
  END,
  upper(w."network"),
  CURRENT_TIMESTAMP
FROM "wallets" w
WHERE w."approvalStatus" = 'APPROVED'
ON CONFLICT ("userId", "address", "network") DO NOTHING;

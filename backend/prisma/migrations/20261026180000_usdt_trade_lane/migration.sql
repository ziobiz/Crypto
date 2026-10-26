-- 크립토 매입 자격 레인. 기존 테스트·샌드박스·실결제가 아닌 건은 SYNTH로 옮긴다.
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "tradeLane" TEXT NOT NULL DEFAULT 'LIVE';

UPDATE "usdt_purchase_details" AS d
SET "tradeLane" = 'SYNTH'
WHERE
  COALESCE(d."adminNote", '') ~* 'sandbox|local[-_ ]?mock|simulator|no live acquirer'
  OR COALESCE(d."curfexRefNo", '') ILIKE 'CURFEX-SBX-%'
  OR COALESCE(d."icopayTransactionId", '') ILIKE 'LOCAL-MOCK-%'
  OR COALESCE(d."collectionAccountJson"::text, '') ~* 'sandbox'
  OR COALESCE(d."curfexLastEventJson"::text, '') ~* 'sandbox|local[-_ ]?mock|simulator'
  OR EXISTS (
    SELECT 1
    FROM "ticket_status_histories" AS h
    WHERE h."ticketId" = d."ticketId"
      AND COALESCE(h."note", '') ~* 'sandbox|local[-_ ]?mock|simulator|no live acquirer'
  );

CREATE INDEX IF NOT EXISTS "usdt_purchase_details_tradeLane_idx" ON "usdt_purchase_details"("tradeLane");

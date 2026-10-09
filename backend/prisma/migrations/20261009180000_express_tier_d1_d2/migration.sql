-- EXPRESS 등급명 T1/T2 → D1/D2 (티켓 저장값)
UPDATE "usdt_purchase_details" SET "expressTier" = 'D1' WHERE "expressTier" = 'T1';
UPDATE "usdt_purchase_details" SET "expressTier" = 'D2' WHERE "expressTier" = 'T2';

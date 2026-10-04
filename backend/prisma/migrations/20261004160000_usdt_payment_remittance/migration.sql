-- AlterEnum: 송금거래(REMITTANCE) 결제수단
DO $$ BEGIN
  ALTER TYPE "UsdtPaymentMethod" ADD VALUE 'REMITTANCE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

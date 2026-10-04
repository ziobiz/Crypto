-- AlterEnum: 직접송금(DIRECT) 수취 방식
DO $$ BEGIN
  ALTER TYPE "UsdtCollectionMode" ADD VALUE 'DIRECT';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

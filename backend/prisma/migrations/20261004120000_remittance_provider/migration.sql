-- 빠른송금 서비스 코드 (WISE / REMITLY / … / OTHER). null이면 미사용
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "remittanceProvider" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "remittanceProviderOther" TEXT;

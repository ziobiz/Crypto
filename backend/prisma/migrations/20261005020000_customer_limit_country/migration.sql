-- 개인 한도 산정 국가·가입 IP/국가
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "limitCountry" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "signupIp" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "signupCountry" TEXT;

-- 기존 개인: 전화 국가번호 → limitCountry 백필
UPDATE "customer_profiles" AS cp
SET "limitCountry" = CASE u."phoneCountryCode"
  WHEN '+81' THEN 'JP'
  WHEN '+82' THEN 'KR'
  WHEN '+66' THEN 'TH'
  WHEN '+1' THEN 'US'
  WHEN '+86' THEN 'CN'
  ELSE cp."limitCountry"
END
FROM "users" AS u
WHERE cp."userId" = u.id
  AND cp."customerType" = 'INDIVIDUAL'
  AND (cp."limitCountry" IS NULL OR BTRIM(cp."limitCountry") = '');

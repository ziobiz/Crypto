-- 소개 가맹점 기록과 조직별 참고 정산(플랫폼 지급 아님)
ALTER TABLE "organizations" ADD COLUMN "introducerRewardEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN "introducerRewardPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "organizations" ADD COLUMN "introducerRewardFixedUsdt" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "customer_profiles" ADD COLUMN "introducedByUserId" TEXT;

ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_introducedByUserId_fkey" FOREIGN KEY ("introducedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "customer_profiles_introducedByUserId_idx" ON "customer_profiles"("introducedByUserId");

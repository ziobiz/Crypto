-- CreateEnum
CREATE TYPE "MemberGrade" AS ENUM ('STANDARD', 'PREMIUM', 'VIP', 'VVIP', 'PRESTIGE', 'BLACK');

-- AlterTable customer_profiles
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "memberGrade" "MemberGrade" NOT NULL DEFAULT 'STANDARD';

-- AlterTable usdt_purchase_details
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "memberGradeSnapshot" TEXT;
ALTER TABLE "usdt_purchase_details" ADD COLUMN IF NOT EXISTS "memberGradeBenefitSnapshot" JSONB;

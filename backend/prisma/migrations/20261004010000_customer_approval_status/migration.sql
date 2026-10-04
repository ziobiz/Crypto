-- CreateEnum
CREATE TYPE "CustomerApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "customer_profiles"
  ADD COLUMN "approvalStatus" "CustomerApprovalStatus" NOT NULL DEFAULT 'APPROVED';

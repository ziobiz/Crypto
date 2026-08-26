-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "customer_kyc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectReason" TEXT,
    "hqNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_kyc_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_kyc_userId_key" ON "customer_kyc"("userId");
CREATE INDEX "customer_kyc_status_idx" ON "customer_kyc"("status");

ALTER TABLE "customer_kyc" ADD CONSTRAINT "customer_kyc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_kyc" ADD CONSTRAINT "customer_kyc_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "customer_kyc_attachments" (
    "id" TEXT NOT NULL,
    "kycId" TEXT NOT NULL,
    "purpose" "AttachmentPurpose" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_kyc_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customer_kyc_attachments_kycId_idx" ON "customer_kyc_attachments"("kycId");

ALTER TABLE "customer_kyc_attachments" ADD CONSTRAINT "customer_kyc_attachments_kycId_fkey" FOREIGN KEY ("kycId") REFERENCES "customer_kyc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

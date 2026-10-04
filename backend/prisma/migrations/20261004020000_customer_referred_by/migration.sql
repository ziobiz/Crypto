-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN "referredByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "customer_profiles_referredByUserId_idx" ON "customer_profiles"("referredByUserId");

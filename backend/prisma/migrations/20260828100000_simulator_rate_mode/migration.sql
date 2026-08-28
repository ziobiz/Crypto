-- CreateEnum
CREATE TYPE "SimulatorRateMode" AS ENUM ('LIVE', 'SAND');

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN "simulatorRateMode" "SimulatorRateMode" NOT NULL DEFAULT 'LIVE';

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "simulatorEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "organizations" ADD COLUMN "simulatorRateMode" "SimulatorRateMode" NOT NULL DEFAULT 'LIVE';

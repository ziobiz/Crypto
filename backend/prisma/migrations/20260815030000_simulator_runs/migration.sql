CREATE TABLE "simulator_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "inputAmount" DECIMAL(20,8) NOT NULL,
    "requiredFiat" DECIMAL(20,2) NOT NULL,
    "netUsdt" DECIMAL(20,8) NOT NULL,
    "totalFeeUsdt" DECIMAL(20,8) NOT NULL,
    "exchangeRate" DECIMAL(20,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulator_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "simulator_runs_createdAt_idx" ON "simulator_runs"("createdAt");
CREATE INDEX "simulator_runs_userId_createdAt_idx" ON "simulator_runs"("userId", "createdAt");

ALTER TABLE "simulator_runs" ADD CONSTRAINT "simulator_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

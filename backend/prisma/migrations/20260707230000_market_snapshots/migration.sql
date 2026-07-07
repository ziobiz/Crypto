-- CreateTable
CREATE TABLE "exchange_rate_snapshots" (
    "id" TEXT NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "source" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_market_snapshots" (
    "id" TEXT NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "volume24hUsdt" DECIMAL(24,4),
    "volume24hQuote" DECIMAL(24,2),
    "changePercent24h" DECIMAL(10,4),
    "source" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_market_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rate_snapshots_currency_capturedAt_idx" ON "exchange_rate_snapshots"("currency", "capturedAt");

-- CreateIndex
CREATE INDEX "exchange_market_snapshots_currency_capturedAt_idx" ON "exchange_market_snapshots"("currency", "capturedAt");

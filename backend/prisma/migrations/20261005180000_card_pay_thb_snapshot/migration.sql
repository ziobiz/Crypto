-- Card payment: ICOPAY charge snapshots (display currency/amount; PG settlement is separate)
ALTER TABLE "usdt_purchase_details"
  ADD COLUMN IF NOT EXISTS "cardPayCurrency" "CurrencyCode",
  ADD COLUMN IF NOT EXISTS "cardPayAmount" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "cardPayCrossRate" DECIMAL(18,8),
  ADD COLUMN IF NOT EXISTS "cardPayUsdtRate" DECIMAL(18,8);

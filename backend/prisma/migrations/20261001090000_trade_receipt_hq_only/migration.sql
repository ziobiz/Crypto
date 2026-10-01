-- 거래명세: 본사만 보관 (이메일 미발송, 본사 명세서 보관)
ALTER TYPE "TradeReceiptEmailMode" ADD VALUE IF NOT EXISTS 'HQ_ONLY';

-- WalletAssetType + EURC (수령 지갑 등록용; 본사 정산자산은 USDT/USDC 유지)
ALTER TYPE "WalletAssetType" ADD VALUE IF NOT EXISTS 'EURC';

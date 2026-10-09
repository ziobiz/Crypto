import type { SettlementAsset } from '@/lib/api';

export function normalizeSettlementAsset(raw?: string | null): SettlementAsset {
  return String(raw ?? '').toUpperCase() === 'USDC' ? 'USDC' : 'USDT';
}

/** 금액·시세 단위 표기 (본사 정산자산) */
export function settlementUnit(asset?: string | null): SettlementAsset {
  return normalizeSettlementAsset(asset);
}

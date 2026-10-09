import { HQ_CONFIG_KEYS } from '../constants/hq-policy';
import { prisma } from '../lib/prisma';

export const SETTLEMENT_ASSETS = ['USDT', 'USDC'] as const;
export type SettlementAsset = (typeof SETTLEMENT_ASSETS)[number];

export function normalizeSettlementAsset(raw: unknown): SettlementAsset {
  const v = String(raw ?? 'USDT').trim().toUpperCase();
  return v === 'USDC' ? 'USDC' : 'USDT';
}

export async function getSettlementAsset(): Promise<SettlementAsset> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.settlementAsset },
  });
  const value = row?.value as { asset?: string } | string | null | undefined;
  if (typeof value === 'string') return normalizeSettlementAsset(value);
  if (value && typeof value === 'object' && 'asset' in value) {
    return normalizeSettlementAsset(value.asset);
  }
  return 'USDT';
}

export async function saveSettlementAsset(asset: SettlementAsset): Promise<SettlementAsset> {
  const normalized = normalizeSettlementAsset(asset);
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.settlementAsset },
    create: {
      key: HQ_CONFIG_KEYS.settlementAsset,
      value: { asset: normalized },
      description: '본사 정산 자산 (USDT/USDC)',
    },
    update: {
      value: { asset: normalized },
      description: '본사 정산 자산 (USDT/USDC)',
    },
  });
  /** 지갑은 USDT/USDC 각각 고객이 별도 등록 — 자동 미러 없음 */
  return normalized;
}

import { prisma } from '../lib/prisma';
import {
  DEFAULT_USDT_SERVICE_MATRIX,
  HQ_CONFIG_KEYS,
  normalizeUsdtServiceMatrix,
  type HqUsdtServiceMatrix,
} from '../constants/hq-policy';

export async function getUsdtServiceMatrix(): Promise<HqUsdtServiceMatrix> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.usdtServiceMatrix },
  });
  if (!row?.value) return DEFAULT_USDT_SERVICE_MATRIX();
  return normalizeUsdtServiceMatrix(row.value as Partial<HqUsdtServiceMatrix>);
}

export async function saveUsdtServiceMatrix(
  config: HqUsdtServiceMatrix,
): Promise<HqUsdtServiceMatrix> {
  const normalized = normalizeUsdtServiceMatrix(config);
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.usdtServiceMatrix },
    create: {
      key: HQ_CONFIG_KEYS.usdtServiceMatrix,
      value: normalized as object,
      description: 'USDT 서비스관리 (개인/법인 × 통화 × 이체·카드·송금)',
    },
    update: { value: normalized as object },
  });
  return normalized;
}

import type { Prisma } from '@prisma/client';
import type { ExpressQuotaByTier, ExpressTier } from '../constants/hq-policy';
import { EXPRESS_QUOTA_TIERS } from '../constants/hq-policy';
import {
  parseQuotaJson,
  remainingQuotaForTier,
} from './paid-membership.service';

type Tx = Prisma.TransactionClient;

/** 잔여에서 티어 1회 차감. 성공 시 true */
export async function consumeExpressQuotaInTx(
  tx: Tx,
  customerProfileId: string,
  tier: string | null | undefined,
): Promise<boolean> {
  const t = String(tier ?? '').toUpperCase() as ExpressTier;
  if (!(EXPRESS_QUOTA_TIERS as readonly string[]).includes(t)) return false;

  const profile = await tx.customerProfile.findUnique({
    where: { id: customerProfileId },
    select: {
      memberGrade: true,
      paidMemberUntil: true,
      expressQuotaRemaining: true,
    },
  });
  if (!profile) return false;

  const remaining = parseQuotaJson(profile.expressQuotaRemaining);
  if (remainingQuotaForTier(remaining, t) <= 0) return false;

  const next: ExpressQuotaByTier = { ...remaining, [t]: remainingQuotaForTier(remaining, t) - 1 };
  await tx.customerProfile.update({
    where: { id: customerProfileId },
    data: { expressQuotaRemaining: next as object },
  });
  return true;
}

export async function restoreExpressQuotaInTx(
  tx: Tx,
  customerProfileId: string,
  tier: string | null | undefined,
): Promise<void> {
  const t = String(tier ?? '').toUpperCase() as ExpressTier;
  if (!(EXPRESS_QUOTA_TIERS as readonly string[]).includes(t)) return;

  const profile = await tx.customerProfile.findUnique({
    where: { id: customerProfileId },
    select: { expressQuotaRemaining: true, expressQuotaGranted: true },
  });
  if (!profile) return;

  const remaining = parseQuotaJson(profile.expressQuotaRemaining);
  const granted = parseQuotaJson(profile.expressQuotaGranted);
  const cur = remainingQuotaForTier(remaining, t);
  const max = remainingQuotaForTier(granted, t);
  const restored = max > 0 ? Math.min(max, cur + 1) : cur + 1;
  const next: ExpressQuotaByTier = { ...remaining, [t]: restored };
  await tx.customerProfile.update({
    where: { id: customerProfileId },
    data: { expressQuotaRemaining: next as object },
  });
}

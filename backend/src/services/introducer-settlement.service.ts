import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { AuthUser } from '../types/auth';

const HIDDEN_ROLES = new Set<string>([UserRole.CUSTOMER, UserRole.CUSTOMER_OPERATOR]);

export type IntroducerSettlementView = {
  introducerName: string;
  introducerEmail: string;
  enabled: boolean;
  percent: number;
  fixedUsdt: number;
  lines: { ticketNo: string; usdtAmount: number; rewardUsdt: number }[];
  totalRewardUsdt: number;
};

function asNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === 'number' ? value : Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

function roundUsdt(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * 소개로 들어온 고객의 완료 거래에 대한 조직 참고 계산.
 * 장부·수수료 정산에는 넣지 않는다. 가맹점 역할에는 반환하지 않는다.
 */
export async function loadIntroducerSettlement(
  actor: AuthUser,
  customerProfileId: string | undefined,
): Promise<IntroducerSettlementView | undefined> {
  if (!customerProfileId || HIDDEN_ROLES.has(actor.role)) return undefined;

  const profile = await prisma.customerProfile.findUnique({
    where: { id: customerProfileId },
    select: {
      introducedByUser: {
        select: {
          name: true,
          email: true,
          customerProfile: { select: { businessName: true } },
        },
      },
      recruitingOrg: {
        select: {
          introducerRewardEnabled: true,
          introducerRewardPercent: true,
          introducerRewardFixedUsdt: true,
        },
      },
    },
  });
  const introducer = profile?.introducedByUser;
  if (!profile || !introducer) return undefined;

  const businessName = introducer.customerProfile?.businessName?.trim() || '';
  const enabled = profile.recruitingOrg.introducerRewardEnabled;
  const percent = asNumber(profile.recruitingOrg.introducerRewardPercent);
  const fixedUsdt = asNumber(profile.recruitingOrg.introducerRewardFixedUsdt);
  const base = {
    introducerName: businessName || introducer.name,
    introducerEmail: introducer.email,
    enabled,
    percent,
    fixedUsdt,
  };
  if (!enabled) {
    return { ...base, lines: [], totalRewardUsdt: 0 };
  }

  const tickets = await prisma.transactionTicket.findMany({
    where: {
      customerId: customerProfileId,
      usdtPurchase: { status: 'COMPLETED' },
    },
    select: {
      ticketNo: true,
      usdtPurchase: { select: { expectedUsdtAmount: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  const lines = tickets.map((ticket) => {
    const usdtAmount = roundUsdt(asNumber(ticket.usdtPurchase?.expectedUsdtAmount));
    const rewardUsdt = roundUsdt((usdtAmount * percent) / 100 + fixedUsdt);
    return { ticketNo: ticket.ticketNo, usdtAmount, rewardUsdt };
  });
  const totalRewardUsdt = roundUsdt(lines.reduce((sum, line) => sum + line.rewardUsdt, 0));
  return { ...base, lines, totalRewardUsdt };
}

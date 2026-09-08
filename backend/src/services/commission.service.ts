import {
  CurrencyCode,
  OrgType,
  Prisma,
  TicketType,
  TradeEscrowStatus,
  UsdtPurchaseStatus,
} from '@prisma/client';
import { AppError } from '../lib/errors';
import {
  defaultOrgSharePolicy,
  HQ_CONFIG_KEYS,
  HQ_ORG_LEVELS,
  normalizeCustomerFeeShare,
  normalizeOrgSharePolicy,
  type HqOrgLevel,
  type HqOrgShareByType,
  type HqOrgSharePolicy,
  type HqOrgShareSlice,
} from '../constants/hq-policy';
import { commissionPoolFromSnapshots } from './transaction-fee.service';

export interface SettlementContext {
  ticketId: string;
  ticketType: TicketType;
  commissionPool: number;
  currency: CurrencyCode;
}

type TxClient = Prisma.TransactionClient;

type ChainOrg = { id: string; name: string; type: OrgType; path: string };

async function loadOrgSharePolicy(): Promise<HqOrgSharePolicy> {
  const { loadEffectiveOrgSharePolicy } = await import('./customer-fee-policy.service');
  return loadEffectiveOrgSharePolicy();
}

function sliceFor(
  policy: HqOrgSharePolicy,
  ticketType: TicketType,
  orgType: OrgType,
): HqOrgShareSlice {
  const byType = ticketType === TicketType.TRADE_ESCROW ? policy.TRADE_ESCROW : policy.USDT_PURCHASE;
  return byType[orgType as HqOrgLevel] ?? { poolPercent: 0, perTicketUsdt: 0 };
}

function shareTableFor(
  policy: HqOrgSharePolicy,
  ticketType: TicketType,
  customerShare: ReturnType<typeof normalizeCustomerFeeShare>,
): HqOrgShareByType {
  return ticketType === TicketType.TRADE_ESCROW ? customerShare.TRADE_ESCROW : customerShare.USDT_PURCHASE;
}

function foldVacantLevelsToHq(byType: HqOrgShareByType, presentTypes: Set<string>): HqOrgShareSlice {
  const hq = byType.HEAD_OFFICE ?? { poolPercent: 0, perTicketUsdt: 0 };
  let poolPercent = hq.poolPercent;
  let perTicketUsdt = hq.perTicketUsdt;
  for (const level of HQ_ORG_LEVELS) {
    if (level === 'HEAD_OFFICE') continue;
    if (presentTypes.has(level)) continue;
    const slice = byType[level] ?? { poolPercent: 0, perTicketUsdt: 0 };
    poolPercent += slice.poolPercent;
    perTicketUsdt += slice.perTicketUsdt;
  }
  return { poolPercent, perTicketUsdt };
}

async function resolveHeadOffice(
  tx: TxClient,
  chain: ChainOrg[],
): Promise<ChainOrg | null> {
  const fromChain = chain.find((o) => o.type === OrgType.HEAD_OFFICE);
  if (fromChain) return fromChain;
  const hq = await tx.organization.findFirst({
    where: { type: OrgType.HEAD_OFFICE, deletedAt: null },
    select: { id: true, name: true, type: true, path: true },
    orderBy: { path: 'asc' },
  });
  return hq;
}

type AllocatedShare = {
  org: ChainOrg;
  slice: HqOrgShareSlice;
  vacantFolded: boolean;
};

async function allocateCommissionShares(
  tx: TxClient,
  chain: ChainOrg[],
  policy: HqOrgSharePolicy,
  ticketType: TicketType,
  customerShare: ReturnType<typeof normalizeCustomerFeeShare>,
): Promise<AllocatedShare[]> {
  const byType = shareTableFor(policy, ticketType, customerShare);
  const present = new Set(chain.map((o) => String(o.type)));
  const allocated: AllocatedShare[] = [];

  for (const org of chain) {
    if (org.type === OrgType.HEAD_OFFICE) continue;
    const slice = byType[org.type as HqOrgLevel] ?? { poolPercent: 0, perTicketUsdt: 0 };
    allocated.push({ org, slice, vacantFolded: false });
  }

  const hqOrg = await resolveHeadOffice(tx, chain);
  if (hqOrg) {
    allocated.push({
      org: hqOrg,
      slice: foldVacantLevelsToHq(byType, present),
      vacantFolded: true,
    });
  }

  return allocated;
}

function lineShareAmount(_ticketType: TicketType, baseAmount: number, slice: HqOrgShareSlice): number {
  // USDT·에스크로 공통: poolPercent는 거래액(또는 gross USDT) 대비 절대 %
  return Number(((baseAmount * slice.poolPercent) / 100 + slice.perTicketUsdt).toFixed(8));
}

async function buildOrgChain(
  tx: TxClient,
  startOrgId: string,
): Promise<ChainOrg[]> {
  const chain: ChainOrg[] = [];
  let currentId: string | null = startOrgId;

  while (currentId) {
    const org: ChainOrg & { parentId: string | null } | null = await tx.organization.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, type: true, path: true, parentId: true },
    });
    if (!org) break;
    chain.push({ id: org.id, name: org.name, type: org.type, path: org.path });
    currentId = org.parentId;
  }

  return chain;
}

export interface CommissionPreviewLine {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  ratePercent: number;
  perTicketUsdt: number;
  amount: number;
  inherited: boolean;
}

async function previewLines(
  recruitingOrgId: string,
  ticketType: TicketType,
  commissionPool: number,
  feeShareRaw?: unknown,
): Promise<{ totalRatePercent: number; commissionPool: number; lines: CommissionPreviewLine[] }> {
  const { prisma } = await import('../lib/prisma');
  const policy = await loadOrgSharePolicy();
  const customerShare = feeShareRaw ? normalizeCustomerFeeShare(feeShareRaw, policy) : normalizeCustomerFeeShare(null, policy);
  const chain = await buildOrgChain(prisma, recruitingOrgId);
  const allocated = await allocateCommissionShares(prisma, chain, policy, ticketType, customerShare);
  const lines: CommissionPreviewLine[] = [];
  let totalRatePercent = 0;

  for (const row of allocated) {
    totalRatePercent += row.slice.poolPercent;
    const amount = lineShareAmount(ticketType, commissionPool, row.slice);
    if (row.slice.poolPercent === 0 && row.slice.perTicketUsdt === 0) continue;
    lines.push({
      organizationId: row.org.id,
      organizationName: row.org.name,
      organizationType: row.org.type,
      ratePercent: row.slice.poolPercent,
      perTicketUsdt: row.slice.perTicketUsdt,
      amount,
      inherited: !feeShareRaw,
    });
  }

  return { totalRatePercent, commissionPool, lines };
}

/** 영업점 → 본사 상위 체인 순회하며 LedgerEntry 생성 */
export async function settleCommission(
  tx: TxClient,
  ctx: SettlementContext,
): Promise<void> {
  const ticket = await tx.transactionTicket.findUnique({
    where: { id: ctx.ticketId },
    include: {
      customer: {
        include: { recruitingOrg: true },
      },
      tradeEscrow: true,
      usdtPurchase: true,
    },
  });

  if (!ticket) {
    throw new AppError(404, 'Ticket not found for settlement', 'NOT_FOUND');
  }

  if (ticket.commissionSettled) {
    return;
  }

  if (ctx.commissionPool <= 0) {
    await tx.transactionTicket.update({
      where: { id: ctx.ticketId },
      data: { commissionSettled: true, commissionSettledAt: new Date() },
    });
    return;
  }

  const policy = await loadOrgSharePolicy();
  const chain = await buildOrgChain(tx, ticket.customer.recruitingOrgId);
  const { resolveCustomerFeeShare } = await import('./customer-fee-policy.service');
  const customerShare = await resolveCustomerFeeShare({
    customerProfileId: ticket.customer.id,
    feeShareRaw: ticket.customer.feeShare,
    asOf: ticket.createdAt,
  });
  const allocated = await allocateCommissionShares(tx, chain, policy, ctx.ticketType, customerShare);

  let shareBase = ctx.commissionPool;
  if (ctx.ticketType === TicketType.TRADE_ESCROW && ticket.tradeEscrow) {
    shareBase = Number(ticket.tradeEscrow.amount);
  } else if (ctx.ticketType === TicketType.USDT_PURCHASE && ticket.usdtPurchase) {
    const rate = Number(ticket.usdtPurchase.exchangeRate);
    shareBase = rate > 0 ? Number(ticket.usdtPurchase.fiatAmount) / rate : ctx.commissionPool;
  }

  for (const row of allocated) {
    const amount = lineShareAmount(ctx.ticketType, shareBase, row.slice);
    if (amount <= 0) continue;

    await tx.ledgerEntry.create({
      data: {
        organizationId: row.org.id,
        ticketId: ctx.ticketId,
        entryType: 'COMMISSION_EARNED',
        amount,
        currency: ctx.currency,
        ratePercent: row.slice.poolPercent,
        baseAmount: shareBase,
        description: `${ctx.ticketType} commission — ${row.org.name}`,
      },
    });
  }

  await tx.transactionTicket.update({
    where: { id: ctx.ticketId },
    data: { commissionSettled: true, commissionSettledAt: new Date() },
  });
}

/** 에스크로·USDT: 운영수수료(절대 %)로 풀을 만들고 조직 배분 미리보기 */
export async function previewCommissionPool(
  recruitingOrgId: string,
  ticketType: TicketType,
  tradeAmount: number,
  feeShareRaw?: unknown,
  customerProfileId?: string,
): Promise<{ totalRatePercent: number; commissionPool: number; lines: CommissionPreviewLine[] }> {
  const policy = await loadOrgSharePolicy();
  let share = normalizeCustomerFeeShare(feeShareRaw, policy);
  if (customerProfileId) {
    const { resolveCustomerFeeShare } = await import('./customer-fee-policy.service');
    share = await resolveCustomerFeeShare({
      customerProfileId,
      feeShareRaw,
    });
  }
  const pool =
    ticketType === TicketType.TRADE_ESCROW
      ? Number(((tradeAmount * share.escrowFeePercent) / 100 + share.escrowPerTicketUsdt).toFixed(8))
      : Number(
          ((tradeAmount * share.usdtOperatingFeePercent) / 100 + share.usdtOperatingFeeUsdt).toFixed(8),
        );
  const preview = await previewLines(recruitingOrgId, ticketType, tradeAmount, share);
  return { ...preview, commissionPool: pool };
}

export async function getOrgSharePolicyCached(): Promise<HqOrgSharePolicy> {
  return loadOrgSharePolicy();
}

export { defaultOrgSharePolicy };

const ticketLedgerSelect = {
  id: true,
  ticketNo: true,
  type: true,
  createdAt: true,
  customer: {
    select: {
      user: { select: { name: true, email: true } },
    },
  },
  usdtPurchase: {
    select: {
      status: true,
      fiatAmount: true,
      fiatCurrency: true,
      expectedUsdtAmount: true,
      actualUsdtAmount: true,
      paymentMethod: true,
    },
  },
  tradeEscrow: {
    select: {
      status: true,
      title: true,
      amount: true,
      currency: true,
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
    },
  },
} as const;

function ledgerTradeContext(ticket: {
  id: string;
  type: string;
  createdAt: Date;
  customer: { user: { name: string; email: string } } | null;
  usdtPurchase: {
    status: string;
    fiatAmount: unknown;
    fiatCurrency: string;
    expectedUsdtAmount: unknown;
    actualUsdtAmount: unknown | null;
    paymentMethod: string;
  } | null;
  tradeEscrow: {
    status: string;
    title: string;
    amount: unknown;
    currency: string;
    buyer: { name: string; email: string };
    seller: { name: string; email: string };
  } | null;
}) {
  const customer = ticket.customer?.user;
  const customerLabel = customer ? `${customer.name} / ${customer.email}` : null;
  let tradeSummary: string | null = null;
  let ticketStatus: string | null = null;
  let ticketHref: string | null = null;

  if (ticket.type === 'USDT_PURCHASE' && ticket.usdtPurchase) {
    const u = ticket.usdtPurchase;
    ticketStatus = u.status;
    ticketHref = `/dashboard/usdt/${ticket.id}`;
    const fiat = Number(u.fiatAmount);
    const usdt =
      u.actualUsdtAmount != null
        ? Number(u.actualUsdtAmount)
        : Number(u.expectedUsdtAmount);
    tradeSummary = `${u.fiatCurrency} ${fiat.toLocaleString()} → ${usdt.toFixed(4)} USDT`;
  } else if (ticket.type === 'TRADE_ESCROW' && ticket.tradeEscrow) {
    const e = ticket.tradeEscrow;
    ticketStatus = e.status;
    ticketHref = `/dashboard/escrow/${ticket.id}`;
    tradeSummary = `${e.title} · ${Number(e.amount).toLocaleString()} ${e.currency} (${e.buyer.name} ↔ ${e.seller.name})`;
  }

  return {
    ticketId: ticket.id,
    ticketHref,
    customerName: customer?.name ?? null,
    customerEmail: customer?.email ?? null,
    customerLabel,
    tradeSummary,
    ticketStatus,
    appliedAt: ticket.createdAt,
  };
}

/** 조직별 누적 수수료 조회 + 미정산(수령 예정) */
export async function getOrgLedgerSummary(
  organizationId: string,
  options?: { from?: Date; to?: Date },
) {
  const { prisma } = await import('../lib/prisma');

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, path: true, name: true, type: true },
  });
  if (!org) throw new AppError(404, 'Organization not found', 'NOT_FOUND');

  const entries = await prisma.ledgerEntry.findMany({
    where: {
      organizationId,
      entryType: 'COMMISSION_EARNED',
      ...(options?.from || options?.to
        ? {
            settledAt: {
              ...(options.from && { gte: options.from }),
              ...(options.to && { lte: options.to }),
            },
          }
        : {}),
    },
    include: {
      ticket: { select: ticketLedgerSelect },
    },
    orderBy: { settledAt: 'desc' },
  });

  const totalAmount = entries.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalsByCurrency: Record<string, number> = {};
  const byTicketType: Record<string, Record<string, number>> = {};

  for (const e of entries) {
    const cur = e.currency;
    const amt = Number(e.amount);
    totalsByCurrency[cur] = (totalsByCurrency[cur] ?? 0) + amt;
    const tt = e.ticket.type;
    if (!byTicketType[tt]) byTicketType[tt] = {};
    byTicketType[tt][cur] = (byTicketType[tt][cur] ?? 0) + amt;
  }

  const pending = await getPendingCommission(organizationId, org.path);
  const usdtTotal = totalsByCurrency[CurrencyCode.USDT] ?? 0;

  return {
    organizationId,
    organizationName: org.name,
    totalAmount: usdtTotal,
    currency: CurrencyCode.USDT,
    totalAmountAll: totalAmount,
    totalsByCurrency,
    byTicketType,
    count: entries.length,
    earnedUsdt: usdtTotal,
    pendingUsdt: pending.totalUsdt,
    pendingCount: pending.lines.length,
    pendingLines: pending.lines,
    entries: entries.map((e) => {
      const ctx = ledgerTradeContext(e.ticket);
      return {
        id: e.id,
        amount: Number(e.amount),
        currency: e.currency,
        ratePercent: Number(e.ratePercent),
        baseAmount: Number(e.baseAmount),
        ticketNo: e.ticket.ticketNo,
        ticketType: e.ticket.type,
        settledAt: e.settledAt,
        description: e.description,
        ...ctx,
      };
    }),
  };
}

async function getPendingCommission(organizationId: string, orgPath: string) {
  const { prisma } = await import('../lib/prisma');
  const policy = await loadOrgSharePolicy();

  const tickets = await prisma.transactionTicket.findMany({
    where: {
      commissionSettled: false,
      customer: {
        recruitingOrg: {
          OR: [{ path: orgPath }, { path: { startsWith: `${orgPath}/` } }],
        },
      },
      OR: [
        {
          type: TicketType.USDT_PURCHASE,
          usdtPurchase: { status: { notIn: [UsdtPurchaseStatus.CANCELLED] } },
        },
        {
          type: TicketType.TRADE_ESCROW,
          tradeEscrow: {
            status: { notIn: [TradeEscrowStatus.CANCELLED, TradeEscrowStatus.VOIDED] },
          },
        },
      ],
    },
    include: {
      usdtPurchase: true,
      tradeEscrow: {
        include: {
          buyer: { select: { name: true, email: true } },
          seller: { select: { name: true, email: true } },
        },
      },
      customer: {
        select: {
          id: true,
          recruitingOrgId: true,
          feeShare: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const lines: Array<{
    ticketNo: string;
    ticketType: string;
    amount: number;
    currency: string;
    ratePercent: number;
    baseAmount: number;
    status: string;
    ticketId: string;
    ticketHref: string | null;
    customerLabel: string | null;
    tradeSummary: string | null;
    appliedAt: Date;
  }> = [];
  let totalUsdt = 0;

  for (const ticket of tickets) {
    let pool = 0;
    let currency: CurrencyCode = CurrencyCode.USDT;
    let status = '';
    if (ticket.type === TicketType.USDT_PURCHASE && ticket.usdtPurchase) {
      pool = commissionPoolFromSnapshots(ticket.usdtPurchase);
      currency = CurrencyCode.USDT;
      status = ticket.usdtPurchase.status;
    } else if (ticket.type === TicketType.TRADE_ESCROW && ticket.tradeEscrow) {
      pool = Number(ticket.tradeEscrow.amount);
      currency = ticket.tradeEscrow.currency;
      status = ticket.tradeEscrow.status;
    }
    if (pool <= 0) continue;

    const chain = await buildOrgChain(prisma, ticket.customer.recruitingOrgId);
    const { resolveCustomerFeeShare } = await import('./customer-fee-policy.service');
    const customerShare = await resolveCustomerFeeShare({
      customerProfileId: ticket.customer.id,
      feeShareRaw: ticket.customer.feeShare,
      asOf: ticket.createdAt,
    });
    const allocated = await allocateCommissionShares(prisma, chain, policy, ticket.type, customerShare);
    const mine = allocated.find((row) => row.org.id === organizationId);
    if (!mine) continue;
    const slice = mine.slice;
    const amount = lineShareAmount(ticket.type, pool, slice);
    if (amount <= 0) continue;
    if (currency === CurrencyCode.USDT) totalUsdt += amount;
    const ctx = ledgerTradeContext({
      id: ticket.id,
      type: ticket.type,
      createdAt: ticket.createdAt,
      customer: ticket.customer?.user
        ? { user: ticket.customer.user }
        : null,
      usdtPurchase: ticket.usdtPurchase
        ? {
            status: ticket.usdtPurchase.status,
            fiatAmount: ticket.usdtPurchase.fiatAmount,
            fiatCurrency: ticket.usdtPurchase.fiatCurrency,
            expectedUsdtAmount: ticket.usdtPurchase.expectedUsdtAmount,
            actualUsdtAmount: ticket.usdtPurchase.actualUsdtAmount,
            paymentMethod: ticket.usdtPurchase.paymentMethod,
          }
        : null,
      tradeEscrow: ticket.tradeEscrow
        ? {
            status: ticket.tradeEscrow.status,
            title: ticket.tradeEscrow.title,
            amount: ticket.tradeEscrow.amount,
            currency: ticket.tradeEscrow.currency,
            buyer: ticket.tradeEscrow.buyer,
            seller: ticket.tradeEscrow.seller,
          }
        : null,
    });
    lines.push({
      ticketNo: ticket.ticketNo,
      ticketType: ticket.type,
      amount,
      currency,
      ratePercent: slice.poolPercent,
      baseAmount: pool,
      status,
      ticketId: ticket.id,
      ticketHref: ctx.ticketHref,
      customerLabel: ctx.customerLabel,
      tradeSummary: ctx.tradeSummary,
      appliedAt: ticket.createdAt,
    });
  }

  return { totalUsdt: Number(totalUsdt.toFixed(8)), lines };
}

export async function getCommissionGrid() {
  const { prisma } = await import('../lib/prisma');
  const policy = await loadOrgSharePolicy();
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, name: true, type: true, path: true, isActive: true },
    orderBy: { path: 'asc' },
  });
  const rates = await prisma.commissionRate.findMany({
    where: { effectiveTo: null },
  });
  const byOrg = new Map<string, typeof rates>();
  for (const r of rates) {
    const list = byOrg.get(r.organizationId) ?? [];
    list.push(r);
    byOrg.set(r.organizationId, list);
  }

  const rows = orgs.map((org) => {
    const list = byOrg.get(org.id) ?? [];
    const pick = (ticketType: TicketType) => {
      const row = list.find((x) => x.ticketType === ticketType);
      const inherited = !row || row.useDefault;
      const slice = inherited
        ? sliceFor(policy, ticketType, org.type)
        : { poolPercent: Number(row.ratePercent), perTicketUsdt: Number(row.perTicketUsdt) };
      return {
        useDefault: inherited,
        poolPercent: slice.poolPercent,
        perTicketUsdt: slice.perTicketUsdt,
      };
    };
    return {
      organizationId: org.id,
      code: org.code,
      name: org.name,
      type: org.type,
      path: org.path,
      isActive: org.isActive,
      USDT_PURCHASE: pick(TicketType.USDT_PURCHASE),
      TRADE_ESCROW: pick(TicketType.TRADE_ESCROW),
    };
  });

  return { policy, rows };
}

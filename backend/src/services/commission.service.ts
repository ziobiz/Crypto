import {
  CurrencyCode,
  Prisma,
  TicketType,
} from '@prisma/client';
import { AppError } from '../lib/errors';

export interface SettlementContext {
  ticketId: string;
  ticketType: TicketType;
  commissionPool: number;
  currency: CurrencyCode;
}

type TxClient = Prisma.TransactionClient;

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

  const chain = await buildOrgChain(tx, ticket.customer.recruitingOrgId);

  for (const org of chain) {
    const rate = await tx.commissionRate.findFirst({
      where: {
        organizationId: org.id,
        ticketType: ctx.ticketType,
        effectiveTo: null,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!rate) continue;

    const ratePercent = Number(rate.ratePercent);
    const amount = (ctx.commissionPool * ratePercent) / 100;

    if (amount <= 0) continue;

    await tx.ledgerEntry.create({
      data: {
        organizationId: org.id,
        ticketId: ctx.ticketId,
        entryType: 'COMMISSION_EARNED',
        amount,
        currency: ctx.currency,
        ratePercent,
        baseAmount: ctx.commissionPool,
        description: `${ctx.ticketType} commission — ${org.name}`,
      },
    });
  }

  await tx.transactionTicket.update({
    where: { id: ctx.ticketId },
    data: { commissionSettled: true, commissionSettledAt: new Date() },
  });
}

async function buildOrgChain(
  tx: TxClient,
  startOrgId: string,
): Promise<Array<{ id: string; name: string }>> {
  const chain: Array<{ id: string; name: string }> = [];
  let currentId: string | null = startOrgId;

  while (currentId) {
    const org: { id: string; name: string; parentId: string | null } | null =
      await tx.organization.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true },
      });
    if (!org) break;
    chain.push({ id: org.id, name: org.name });
    currentId = org.parentId;
  }

  return chain;
}

/** 조직별 누적 수수료 조회 */
export async function getOrgLedgerSummary(
  organizationId: string,
  options?: { from?: Date; to?: Date },
) {
  const { prisma } = await import('../lib/prisma');

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
      ticket: { select: { ticketNo: true, type: true } },
    },
    orderBy: { settledAt: 'desc' },
  });

  const totalAmount = entries.reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    organizationId,
    totalAmount,
    currency: entries[0]?.currency ?? CurrencyCode.KRW,
    count: entries.length,
    entries: entries.map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      currency: e.currency,
      ratePercent: Number(e.ratePercent),
      baseAmount: Number(e.baseAmount),
      ticketNo: e.ticket.ticketNo,
      ticketType: e.ticket.type,
      settledAt: e.settledAt,
      description: e.description,
    })),
  };
}

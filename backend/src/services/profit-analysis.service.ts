import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/auth';
import { isCostAnalysisRole } from '../constants/hq-admin';

export async function listProfitAnalysis() {
  const rows = await prisma.usdtPurchaseDetail.findMany({
    where: { status: { not: 'CANCELLED' } },
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: {
      ticket: {
        include: {
          customer: { include: { user: { select: { name: true, email: true } } } },
        },
      },
    },
  });
  return rows.map((d) => {
    const expected = Number(d.expectedUsdtAmount);
    const broker = d.brokerUsdtAmount != null ? Number(d.brokerUsdtAmount) : null;
    return {
      ticketId: d.ticketId,
      ticketNo: d.ticket.ticketNo,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      customerName: d.ticket.customer.user.name,
      customerEmail: d.ticket.customer.user.email,
      fiatAmount: Number(d.fiatAmount),
      fiatCurrency: d.fiatCurrency,
      exchangeRate: Number(d.exchangeRate),
      expectedUsdtAmount: expected,
      brokerUsdtAmount: broker,
      profitUsdt: broker == null ? null : Number((broker - expected).toFixed(8)),
    };
  });
}

export async function setBrokerUsdt(user: AuthUser, ticketId: string, brokerUsdtAmount: number) {
  if (!isCostAnalysisRole(user.role)) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  if (!Number.isFinite(brokerUsdtAmount) || brokerUsdtAmount < 0) {
    throw new AppError(400, 'Invalid broker USDT', 'VALIDATION');
  }
  const detail = await prisma.usdtPurchaseDetail.findUnique({ where: { ticketId } });
  if (!detail) throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  await prisma.usdtPurchaseDetail.update({
    where: { ticketId },
    data: { brokerUsdtAmount },
  });
  return listProfitAnalysis().then((items) => items.find((i) => i.ticketId === ticketId));
}

import { Prisma, TicketType, UsdtPurchaseStatus, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { AuthUser } from '../types/auth';
import {
  calculateExpectedUsdt,
  fetchUsdtKrwRate,
} from './exchange-rate.service';
import { settleCommission } from './commission.service';

const USDT_PURCHASE_INCLUDE = {
  usdtPurchase: { include: { wallet: true } },
  customer: {
    include: {
      user: { select: { id: true, name: true, email: true } },
      recruitingOrg: { select: { id: true, name: true, code: true, path: true } },
    },
  },
  attachments: true,
  statusHistory: {
    orderBy: { createdAt: 'asc' as const },
    include: { changedBy: { select: { id: true, name: true, role: true } } },
  },
} satisfies Prisma.TransactionTicketInclude;

/** 관리자 전용 상태 전환 */
const ADMIN_TRANSITIONS: Record<UsdtPurchaseStatus, UsdtPurchaseStatus[]> = {
  [UsdtPurchaseStatus.APPLICATION_COMPLETED]: [UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING],
  [UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING]: [UsdtPurchaseStatus.ADMIN_REVIEWING],
  [UsdtPurchaseStatus.ADMIN_REVIEWING]: [
    UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
    UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
  ],
  [UsdtPurchaseStatus.TRANSFER_IN_PROGRESS]: [UsdtPurchaseStatus.COMPLETED],
  [UsdtPurchaseStatus.COMPLETED]: [],
  [UsdtPurchaseStatus.CANCELLED]: [],
};

/** 고객: 입금 증빙 제출 시 전환 */
const CUSTOMER_TRANSITIONS: Record<UsdtPurchaseStatus, UsdtPurchaseStatus[]> = {
  [UsdtPurchaseStatus.APPLICATION_COMPLETED]: [UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING],
  [UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING]: [UsdtPurchaseStatus.ADMIN_REVIEWING],
  [UsdtPurchaseStatus.ADMIN_REVIEWING]: [],
  [UsdtPurchaseStatus.TRANSFER_IN_PROGRESS]: [],
  [UsdtPurchaseStatus.COMPLETED]: [],
  [UsdtPurchaseStatus.CANCELLED]: [],
};

function generateTicketNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `USDT-${date}-${rand}`;
}

export async function createUsdtPurchaseTicket(
  user: AuthUser,
  input: {
    fiatAmount: number;
    fiatCurrency?: 'KRW' | 'USD';
    walletId: string;
  },
) {
  if (user.role !== UserRole.CUSTOMER || !user.customerProfileId) {
    throw new AppError(403, 'Only customers can create purchase tickets', 'FORBIDDEN');
  }

  const wallet = await prisma.wallet.findFirst({
    where: {
      id: input.walletId,
      userId: user.id,
      isActive: true,
    },
  });

  if (!wallet) {
    throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
  }

  const { rate, source, fetchedAt } = await fetchUsdtKrwRate();
  const gasFee = Number(wallet.gasFeeAmount);
  const platformFee = Number(wallet.platformFeeAmount);
  const expectedUsdt = calculateExpectedUsdt(input.fiatAmount, rate, gasFee, platformFee);

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.transactionTicket.create({
      data: {
        ticketNo: generateTicketNo(),
        type: TicketType.USDT_PURCHASE,
        customerId: user.customerProfileId!,
        usdtPurchase: {
          create: {
            status: UsdtPurchaseStatus.APPLICATION_COMPLETED,
            fiatAmount: input.fiatAmount,
            fiatCurrency: input.fiatCurrency ?? 'KRW',
            exchangeRate: rate,
            exchangeRateAt: fetchedAt,
            exchangeSource: source,
            expectedUsdtAmount: expectedUsdt,
            gasFeeSnapshot: gasFee,
            platformFeeSnapshot: platformFee,
            walletId: wallet.id,
          },
        },
      },
      include: USDT_PURCHASE_INCLUDE,
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: created.id,
        fromStatus: null,
        toStatus: UsdtPurchaseStatus.APPLICATION_COMPLETED,
        changedById: user.id,
        note: 'USDT 매입 신청',
      },
    });

    // 신청 완료 → 입금 증빙 대기
    await tx.usdtPurchaseDetail.update({
      where: { ticketId: created.id },
      data: { status: UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: created.id,
        fromStatus: UsdtPurchaseStatus.APPLICATION_COMPLETED,
        toStatus: UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
        changedById: user.id,
        note: '입금 증빙 대기',
      },
    });

    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: created.id },
      include: USDT_PURCHASE_INCLUDE,
    });
  });

  return serializeTicket(ticket);
}

export async function listUsdtPurchaseTickets(user: AuthUser) {
  const { buildTicketListFilter } = await import('./ticket-access.service');
  const where = buildTicketListFilter(user, TicketType.USDT_PURCHASE);

  const tickets = await prisma.transactionTicket.findMany({
    where,
    include: USDT_PURCHASE_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return tickets.map(serializeTicket);
}

export async function getUsdtPurchaseTicket(user: AuthUser, ticketId: string) {
  const { assertTicketAccess } = await import('./ticket-access.service');
  await assertTicketAccess(user, ticketId);

  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId, type: TicketType.USDT_PURCHASE },
    include: USDT_PURCHASE_INCLUDE,
  });

  if (!ticket) {
    throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  }

  return serializeTicket(ticket);
}

export async function transitionUsdtPurchaseStatus(
  user: AuthUser,
  ticketId: string,
  toStatus: UsdtPurchaseStatus,
  extra?: { usdtTxId?: string; actualUsdtAmount?: number; adminNote?: string },
) {
  const { assertTicketAccess, canChangeTicketStatus } = await import(
    './ticket-access.service'
  );
  await assertTicketAccess(user, ticketId);

  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId },
    include: { usdtPurchase: true },
  });

  if (!ticket?.usdtPurchase) {
    throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  }

  const fromStatus = ticket.usdtPurchase.status;
  const isAdmin = canChangeTicketStatus(user);
  const allowed = isAdmin
    ? ADMIN_TRANSITIONS[fromStatus]
    : CUSTOMER_TRANSITIONS[fromStatus];

  if (!allowed.includes(toStatus)) {
    throw new AppError(
      400,
      `Cannot transition from ${fromStatus} to ${toStatus}`,
      'INVALID_TRANSITION',
    );
  }

  if (toStatus === UsdtPurchaseStatus.COMPLETED) {
    if (!extra?.usdtTxId) {
      throw new AppError(400, 'usdtTxId is required for completion', 'VALIDATION_ERROR');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.usdtPurchaseDetail.update({
      where: { ticketId },
      data: {
        status: toStatus,
        ...(extra?.usdtTxId && { usdtTxId: extra.usdtTxId }),
        ...(extra?.actualUsdtAmount != null && {
          actualUsdtAmount: extra.actualUsdtAmount,
        }),
        ...(extra?.adminNote && { adminNote: extra.adminNote }),
      },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus,
        toStatus,
        changedById: user.id,
        note: extra?.adminNote,
      },
    });

    if (toStatus === UsdtPurchaseStatus.COMPLETED && !ticket.commissionSettled) {
      const detail = await tx.usdtPurchaseDetail.findUniqueOrThrow({
        where: { ticketId },
      });
      const commissionPool =
        Number(detail.gasFeeSnapshot) + Number(detail.platformFeeSnapshot);
      await settleCommission(tx, {
        ticketId,
        ticketType: TicketType.USDT_PURCHASE,
        commissionPool,
        currency: detail.fiatCurrency,
      });
    }

    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: ticketId },
      include: USDT_PURCHASE_INCLUDE,
    });
  });

  return serializeTicket(updated);
}

function serializeTicket(ticket: Prisma.TransactionTicketGetPayload<{
  include: typeof USDT_PURCHASE_INCLUDE;
}>) {
  const detail = ticket.usdtPurchase!;
  return {
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    type: ticket.type,
    commissionSettled: ticket.commissionSettled,
    commissionSettledAt: ticket.commissionSettledAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    customer: ticket.customer,
    status: detail.status,
    fiatAmount: Number(detail.fiatAmount),
    fiatCurrency: detail.fiatCurrency,
    exchangeRate: Number(detail.exchangeRate),
    exchangeRateAt: detail.exchangeRateAt,
    exchangeSource: detail.exchangeSource,
    expectedUsdtAmount: Number(detail.expectedUsdtAmount),
    gasFeeSnapshot: Number(detail.gasFeeSnapshot),
    platformFeeSnapshot: Number(detail.platformFeeSnapshot),
    usdtTxId: detail.usdtTxId,
    actualUsdtAmount: detail.actualUsdtAmount
      ? Number(detail.actualUsdtAmount)
      : null,
    adminNote: detail.adminNote,
    wallet: detail.wallet,
    attachments: ticket.attachments,
    statusHistory: ticket.statusHistory,
  };
}

export { USDT_PURCHASE_INCLUDE };

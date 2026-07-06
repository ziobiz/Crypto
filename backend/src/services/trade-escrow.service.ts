import {
  Prisma,
  TicketType,
  TradeEscrowStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { AuthUser } from '../types/auth';
import { settleCommission } from './commission.service';
import {
  buildTicketListFilter,
  isEscrowBuyer,
  isEscrowSeller,
} from './ticket-access.service';

const ESCROW_INCLUDE = {
  tradeEscrow: {
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  },
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

const ADMIN_TRANSITIONS: Record<TradeEscrowStatus, TradeEscrowStatus[]> = {
  [TradeEscrowStatus.ESCROW_CREATED]: [TradeEscrowStatus.BUYER_DEPOSIT_PROOF],
  [TradeEscrowStatus.BUYER_DEPOSIT_PROOF]: [TradeEscrowStatus.ADMIN_DEPOSIT_CONFIRMED],
  [TradeEscrowStatus.ADMIN_DEPOSIT_CONFIRMED]: [TradeEscrowStatus.SELLER_FULFILLMENT_PROOF],
  [TradeEscrowStatus.SELLER_FULFILLMENT_PROOF]: [TradeEscrowStatus.BUYER_FINAL_APPROVAL],
  [TradeEscrowStatus.BUYER_FINAL_APPROVAL]: [TradeEscrowStatus.ESCROW_COMPLETED],
  [TradeEscrowStatus.ESCROW_COMPLETED]: [],
  [TradeEscrowStatus.CANCELLED]: [],
  [TradeEscrowStatus.DISPUTED]: [],
};

function generateTicketNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ESC-${date}-${rand}`;
}

function getAllowedTransitions(
  user: AuthUser,
  from: TradeEscrowStatus,
  buyerId: string,
  sellerId: string,
): TradeEscrowStatus[] {
  if (user.role === UserRole.SUPER_ADMIN) {
    return ADMIN_TRANSITIONS[from] ?? [];
  }
  if (isEscrowBuyer(user, buyerId) && from === TradeEscrowStatus.SELLER_FULFILLMENT_PROOF) {
    return [TradeEscrowStatus.BUYER_FINAL_APPROVAL];
  }
  if (isEscrowSeller(user, sellerId) && from === TradeEscrowStatus.ADMIN_DEPOSIT_CONFIRMED) {
    return [TradeEscrowStatus.SELLER_FULFILLMENT_PROOF];
  }
  return [];
}

export async function createTradeEscrowTicket(
  user: AuthUser,
  input: {
    sellerEmail: string;
    title: string;
    description?: string;
    amount: number;
    currency?: 'KRW' | 'USD';
    totalCommissionPool?: number;
  },
) {
  if (user.role !== UserRole.CUSTOMER || !user.customerProfileId) {
    throw new AppError(403, 'Only customers can create escrow tickets', 'FORBIDDEN');
  }

  const seller = await prisma.user.findUnique({
    where: { email: input.sellerEmail },
  });

  if (!seller || !seller.isActive) {
    throw new AppError(404, 'Seller not found', 'NOT_FOUND');
  }

  if (seller.id === user.id) {
    throw new AppError(400, 'Buyer and seller must be different', 'VALIDATION_ERROR');
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.transactionTicket.create({
      data: {
        ticketNo: generateTicketNo(),
        type: TicketType.TRADE_ESCROW,
        customerId: user.customerProfileId!,
        tradeEscrow: {
          create: {
            status: TradeEscrowStatus.ESCROW_CREATED,
            buyerId: user.id,
            sellerId: seller.id,
            title: input.title,
            description: input.description,
            amount: input.amount,
            currency: input.currency ?? 'KRW',
            totalCommissionPool: input.totalCommissionPool ?? input.amount * 0.01,
          },
        },
      },
      include: ESCROW_INCLUDE,
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: created.id,
        fromStatus: null,
        toStatus: TradeEscrowStatus.ESCROW_CREATED,
        changedById: user.id,
        note: '에스크로 생성',
      },
    });

    await tx.tradeEscrowDetail.update({
      where: { ticketId: created.id },
      data: { status: TradeEscrowStatus.BUYER_DEPOSIT_PROOF },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: created.id,
        fromStatus: TradeEscrowStatus.ESCROW_CREATED,
        toStatus: TradeEscrowStatus.BUYER_DEPOSIT_PROOF,
        changedById: user.id,
        note: '구매자 입금 증빙 대기',
      },
    });

    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: created.id },
      include: ESCROW_INCLUDE,
    });
  });

  return serializeEscrowTicket(ticket);
}

export async function listTradeEscrowTickets(user: AuthUser) {
  const where = buildTicketListFilter(user, TicketType.TRADE_ESCROW);

  const tickets = await prisma.transactionTicket.findMany({
    where,
    include: ESCROW_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return tickets.map(serializeEscrowTicket);
}

export async function getTradeEscrowTicket(user: AuthUser, ticketId: string) {
  const { assertTicketAccess } = await import('./ticket-access.service');
  await assertTicketAccess(user, ticketId);

  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId, type: TicketType.TRADE_ESCROW },
    include: ESCROW_INCLUDE,
  });

  if (!ticket) {
    throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  }

  return serializeEscrowTicket(ticket);
}

export async function transitionTradeEscrowStatus(
  user: AuthUser,
  ticketId: string,
  toStatus: TradeEscrowStatus,
  extra?: {
    payoutTxId?: string;
    sellerPayoutAccount?: string;
    adminNote?: string;
  },
) {
  const { assertTicketAccess } = await import('./ticket-access.service');
  await assertTicketAccess(user, ticketId);

  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId },
    include: { tradeEscrow: true },
  });

  if (!ticket?.tradeEscrow) {
    throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  }

  const detail = ticket.tradeEscrow;
  const fromStatus = detail.status;
  const allowed = getAllowedTransitions(user, fromStatus, detail.buyerId, detail.sellerId);

  if (!allowed.includes(toStatus)) {
    throw new AppError(
      400,
      `Cannot transition from ${fromStatus} to ${toStatus}`,
      'INVALID_TRANSITION',
    );
  }

  if (toStatus === TradeEscrowStatus.ESCROW_COMPLETED && !extra?.payoutTxId) {
    throw new AppError(400, 'payoutTxId is required for completion', 'VALIDATION_ERROR');
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tradeEscrowDetail.update({
      where: { ticketId },
      data: {
        status: toStatus,
        ...(extra?.payoutTxId && { payoutTxId: extra.payoutTxId }),
        ...(extra?.sellerPayoutAccount && { sellerPayoutAccount: extra.sellerPayoutAccount }),
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

    if (toStatus === TradeEscrowStatus.ESCROW_COMPLETED && !ticket.commissionSettled) {
      await settleCommission(tx, {
        ticketId,
        ticketType: TicketType.TRADE_ESCROW,
        commissionPool: Number(detail.totalCommissionPool),
        currency: detail.currency,
      });
    }

    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: ticketId },
      include: ESCROW_INCLUDE,
    });
  });

  return serializeEscrowTicket(updated);
}

/** 구매자 입금 증빙 업로드 후 관리자 확인 대기 */
export async function submitBuyerDepositProof(user: AuthUser, ticketId: string) {
  const ticket = await getTradeEscrowTicket(user, ticketId);
  if (!isEscrowBuyer(user, ticket.buyer.id)) {
    throw new AppError(403, 'Only buyer can submit deposit proof', 'FORBIDDEN');
  }
  if (ticket.status !== TradeEscrowStatus.BUYER_DEPOSIT_PROOF) {
    throw new AppError(400, 'Invalid status for deposit proof', 'INVALID_TRANSITION');
  }
  return ticket;
}

/** 판매자 이행 증빙 업로드 후 구매자 승인 대기 */
export async function submitSellerFulfillment(user: AuthUser, ticketId: string) {
  return transitionTradeEscrowStatus(
    user,
    ticketId,
    TradeEscrowStatus.SELLER_FULFILLMENT_PROOF,
  );
}

function serializeEscrowTicket(
  ticket: Prisma.TransactionTicketGetPayload<{ include: typeof ESCROW_INCLUDE }>,
) {
  const detail = ticket.tradeEscrow!;
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
    title: detail.title,
    description: detail.description,
    amount: Number(detail.amount),
    currency: detail.currency,
    totalCommissionPool: Number(detail.totalCommissionPool),
    sellerPayoutAccount: detail.sellerPayoutAccount,
    payoutTxId: detail.payoutTxId,
    adminNote: detail.adminNote,
    buyer: detail.buyer,
    seller: detail.seller,
    attachments: ticket.attachments,
    statusHistory: ticket.statusHistory,
  };
}

export { ESCROW_INCLUDE };

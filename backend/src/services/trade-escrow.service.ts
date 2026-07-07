import {
  CurrencyCode,
  CustomerType,
  Prisma,
  TicketType,
  TradeEscrowStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { AuthUser } from '../types/auth';
import { previewCommissionPool, settleCommission } from './commission.service';
import {
  acceptanceDeadlineKst,
  classifyEscrowTier,
  schedulePayoutAt,
} from './escrow-tier.service';
import {
  buildTicketListFilter,
  isEscrowBuyer,
  isEscrowSeller,
} from './ticket-access.service';
import { hqPolicyService } from './hq-policy.service';

export const ESCROW_CURRENCIES = ['KRW', 'USD', 'JPY', 'THB', 'CNY', 'USDT'] as const;
export type EscrowCurrency = (typeof ESCROW_CURRENCIES)[number];
export const ESCROW_DEPOSIT_WINDOW_HOURS = 72;

const ESCROW_INCLUDE = {
  tradeEscrow: {
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          customerProfile: { select: { customerType: true, businessName: true } },
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          customerProfile: { select: { customerType: true, businessName: true } },
        },
      },
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

const PENDING_STATUSES: TradeEscrowStatus[] = [
  TradeEscrowStatus.ESCROW_CREATED,
  TradeEscrowStatus.SELLER_ACCEPTED,
];

function generateTicketNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ESC-${date}-${rand}`;
}

function isAdmin(user: AuthUser): boolean {
  return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORG_STAFF;
}

async function resolveMemberByEmail(email: string) {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: normalized, mode: 'insensitive' },
      isActive: true,
    },
    include: {
      customerProfile: { select: { id: true, customerType: true, businessName: true } },
    },
  });

  if (!user || user.role !== UserRole.CUSTOMER || !user.customerProfile) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    customerProfileId: user.customerProfile.id,
    customerType: user.customerProfile.customerType,
    businessName: user.customerProfile.businessName,
  };
}

async function getCustomerTypes(buyerId: string, sellerId: string) {
  const [buyer, seller] = await Promise.all([
    prisma.customerProfile.findFirst({ where: { userId: buyerId }, select: { customerType: true } }),
    prisma.customerProfile.findFirst({ where: { userId: sellerId }, select: { customerType: true } }),
  ]);
  if (!buyer || !seller) {
    throw new AppError(400, 'Both parties must be registered customers', 'VALIDATION_ERROR');
  }
  return { buyerType: buyer.customerType, sellerType: seller.customerType };
}

function bothPartiesReady(detail: {
  buyerAcceptedAt: Date | null;
  sellerAcceptedAt: Date | null;
  buyerDisclaimerAt: Date | null;
  sellerDisclaimerAt: Date | null;
}): boolean {
  return Boolean(
    detail.buyerAcceptedAt &&
      detail.sellerAcceptedAt &&
      detail.buyerDisclaimerAt &&
      detail.sellerDisclaimerAt,
  );
}

async function activateEscrowIfReady(
  tx: Prisma.TransactionClient,
  ticketId: string,
  userId: string,
  fromStatus: TradeEscrowStatus,
) {
  const detail = await tx.tradeEscrowDetail.findFirstOrThrow({ where: { ticketId } });
  if (!bothPartiesReady(detail)) return detail;

  await tx.tradeEscrowDetail.update({
    where: { ticketId },
    data: {
      status: TradeEscrowStatus.BUYER_DEPOSIT_PROOF,
      buyerContractConfirmedAt: detail.buyerDisclaimerAt,
      sellerContractConfirmedAt: detail.sellerDisclaimerAt,
      depositDeadlineAt: new Date(Date.now() + ESCROW_DEPOSIT_WINDOW_HOURS * 60 * 60 * 1000),
    },
  });
  await tx.ticketStatusHistory.create({
    data: {
      ticketId,
      fromStatus,
      toStatus: TradeEscrowStatus.BUYER_DEPOSIT_PROOF,
      changedById: userId,
      note: '양측 수락 완료 — 에스크로 활성화·입금 대기',
    },
  });
  return tx.tradeEscrowDetail.findFirstOrThrow({ where: { ticketId } });
}

export async function lookupEscrowMember(email: string) {
  const member = await resolveMemberByEmail(email);
  if (!member) return { found: false as const };
  return {
    found: true as const,
    member: {
      id: member.id,
      name: member.name,
      email: member.email,
      customerType: member.customerType,
      businessName: member.businessName,
    },
  };
}

export async function previewEscrowFees(user: AuthUser, amount: number, currency: EscrowCurrency) {
  if (user.role !== UserRole.CUSTOMER || !user.customerProfileId) {
    throw new AppError(403, 'Only customers can preview escrow fees', 'FORBIDDEN');
  }
  const customer = await prisma.customerProfile.findUnique({
    where: { id: user.customerProfileId },
    select: { recruitingOrgId: true },
  });
  if (!customer) throw new AppError(404, 'Customer profile not found', 'NOT_FOUND');

  const preview = await previewCommissionPool(customer.recruitingOrgId, TicketType.TRADE_ESCROW, amount);
  return {
    amount,
    currency,
    totalRatePercent: preview.totalRatePercent,
    commissionPool: preview.commissionPool,
    netToSeller: amount - preview.commissionPool,
    lines: preview.lines,
  };
}

export async function createTradeEscrowTicket(
  user: AuthUser,
  input: {
    counterpartyEmail: string;
    myRole: 'BUYER' | 'SELLER';
    title: string;
    description?: string;
    escrowTerms?: string;
    amount: number;
    currency?: EscrowCurrency;
    deliveryTerms?: string;
    deliveryDeadline?: string;
    disclaimerAccepted: boolean;
    retryParentTicketId?: string;
  },
) {
  if (user.role !== UserRole.CUSTOMER || !user.customerProfileId) {
    throw new AppError(403, 'Only customers can create escrow tickets', 'FORBIDDEN');
  }
  if (!input.disclaimerAccepted) {
    throw new AppError(400, 'Disclaimer must be accepted', 'VALIDATION_ERROR');
  }

  const counterparty = await resolveMemberByEmail(input.counterpartyEmail);
  if (!counterparty) {
    throw new AppError(404, 'Counterparty must be a registered member', 'NOT_FOUND');
  }
  if (counterparty.id === user.id) {
    throw new AppError(400, 'Buyer and seller must be different', 'VALIDATION_ERROR');
  }

  const buyerId = input.myRole === 'BUYER' ? user.id : counterparty.id;
  const sellerId = input.myRole === 'SELLER' ? user.id : counterparty.id;
  const now = new Date();
  const acceptanceDeadlineAt = acceptanceDeadlineKst(now);

  let retryCount = 0;
  if (input.retryParentTicketId) {
    const parent = await prisma.tradeEscrowDetail.findFirst({
      where: { ticketId: input.retryParentTicketId, status: TradeEscrowStatus.VOIDED },
    });
    if (!parent) {
      throw new AppError(400, 'Only voided contracts can be retried once', 'VALIDATION_ERROR');
    }
    const existingRetry = await prisma.tradeEscrowDetail.count({
      where: { retryParentTicketId: input.retryParentTicketId },
    });
    if (existingRetry >= 1) {
      throw new AppError(400, 'Retry limit reached for this contract', 'VALIDATION_ERROR');
    }
    retryCount = 1;
  }

  const { buyerType, sellerType } = await getCustomerTypes(buyerId, sellerId);
  const { tier, requiresReview } = classifyEscrowTier(buyerType, sellerType);
  const currency = (input.currency ?? 'KRW') as CurrencyCode;

  const applicantProfile = await prisma.customerProfile.findUniqueOrThrow({
    where: { id: user.customerProfileId },
    select: { recruitingOrgId: true },
  });
  const feePreview = await previewCommissionPool(
    applicantProfile.recruitingOrgId,
    TicketType.TRADE_ESCROW,
    input.amount,
  );

  const initiatorIsBuyer = input.myRole === 'BUYER';
  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.transactionTicket.create({
      data: {
        ticketNo: generateTicketNo(),
        type: TicketType.TRADE_ESCROW,
        customerId: user.customerProfileId!,
        tradeEscrow: {
          create: {
            status: TradeEscrowStatus.ESCROW_CREATED,
            tradeTier: tier,
            requiresReview,
            buyerId,
            sellerId,
            initiatedByUserId: user.id,
            initiatedAsRole: input.myRole,
            title: input.title,
            description: input.description,
            escrowTerms: input.escrowTerms,
            amount: input.amount,
            currency,
            totalCommissionPool: feePreview.commissionPool,
            deliveryTerms: input.deliveryTerms,
            deliveryDeadline: input.deliveryDeadline ? new Date(input.deliveryDeadline) : undefined,
            acceptanceDeadlineAt,
            retryParentTicketId: input.retryParentTicketId,
            retryCount,
            ...(initiatorIsBuyer
              ? { buyerAcceptedAt: now, buyerDisclaimerAt: now }
              : { sellerAcceptedAt: now, sellerDisclaimerAt: now }),
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
        note: '에스크로 신청 — 상대방 수락 대기',
      },
    });

    const detail = created.tradeEscrow!;
    if (bothPartiesReady(detail)) {
      await activateEscrowIfReady(tx, created.id, user.id, TradeEscrowStatus.ESCROW_CREATED);
    }

    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: created.id },
      include: ESCROW_INCLUDE,
    });
  });

  return serializeEscrowTicket(ticket);
}

export async function acceptEscrowParty(
  user: AuthUser,
  ticketId: string,
  input: { disclaimerAccepted: boolean },
) {
  if (!input.disclaimerAccepted) {
    throw new AppError(400, 'Disclaimer must be accepted', 'VALIDATION_ERROR');
  }

  const detail = await loadEscrowDetail(ticketId);
  if (!PENDING_STATUSES.includes(detail.status)) {
    throw new AppError(400, 'Escrow not awaiting acceptance', 'INVALID_TRANSITION');
  }
  if (detail.acceptanceDeadlineAt && detail.acceptanceDeadlineAt < new Date()) {
    throw new AppError(400, 'Acceptance deadline passed', 'ACCEPTANCE_EXPIRED');
  }

  const isBuyer = isEscrowBuyer(user, detail.buyerId);
  const isSeller = isEscrowSeller(user, detail.sellerId);
  if (!isBuyer && !isSeller) {
    throw new AppError(403, 'Only buyer or seller can accept', 'FORBIDDEN');
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    await tx.tradeEscrowDetail.update({
      where: { ticketId },
      data: {
        ...(isBuyer && { buyerAcceptedAt: now, buyerDisclaimerAt: now }),
        ...(isSeller && { sellerAcceptedAt: now, sellerDisclaimerAt: now }),
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: detail.status,
        toStatus: detail.status,
        changedById: user.id,
        note: isBuyer ? '구매자 수락·면책 동의' : '판매자 수락·면책 동의',
      },
    });
    await activateEscrowIfReady(tx, ticketId, user.id, detail.status);
    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: ticketId },
      include: ESCROW_INCLUDE,
    });
  });

  return serializeEscrowTicket(updated);
}

export async function rejectEscrowParty(user: AuthUser, ticketId: string, reason?: string) {
  const detail = await loadEscrowDetail(ticketId);
  if (!PENDING_STATUSES.includes(detail.status)) {
    throw new AppError(400, 'Escrow not awaiting acceptance', 'INVALID_TRANSITION');
  }
  const isBuyer = isEscrowBuyer(user, detail.buyerId);
  const isSeller = isEscrowSeller(user, detail.sellerId);
  if (!isBuyer && !isSeller) {
    throw new AppError(403, 'Only buyer or seller can reject', 'FORBIDDEN');
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tradeEscrowDetail.update({
      where: { ticketId },
      data: {
        status: TradeEscrowStatus.CANCELLED,
        rejectionReason: reason ?? '상대방 거절',
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: detail.status,
        toStatus: TradeEscrowStatus.CANCELLED,
        changedById: user.id,
        note: reason ?? '거래 거절',
      },
    });
    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: ticketId },
      include: ESCROW_INCLUDE,
    });
  });

  return serializeEscrowTicket(updated);
}

export async function openEscrowDeposit(user: AuthUser, ticketId: string) {
  const detail = await loadEscrowDetail(ticketId);
  if (detail.status === TradeEscrowStatus.BUYER_DEPOSIT_PROOF) {
    return getTradeEscrowTicket(user, ticketId);
  }
  if (detail.status !== TradeEscrowStatus.CONTRACT_CONFIRMED) {
    throw new AppError(400, 'Escrow must be active before deposit', 'INVALID_TRANSITION');
  }
  if (!bothPartiesReady(detail)) {
    throw new AppError(400, 'Both parties must accept first', 'VALIDATION_ERROR');
  }

  const depositDeadlineAt = new Date(Date.now() + ESCROW_DEPOSIT_WINDOW_HOURS * 60 * 60 * 1000);
  const updated = await prisma.$transaction(async (tx) => {
    await tx.tradeEscrowDetail.update({
      where: { ticketId },
      data: { status: TradeEscrowStatus.BUYER_DEPOSIT_PROOF, depositDeadlineAt },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: TradeEscrowStatus.CONTRACT_CONFIRMED,
        toStatus: TradeEscrowStatus.BUYER_DEPOSIT_PROOF,
        changedById: user.id,
        note: '구매자 입금 단계 시작',
      },
    });
    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: ticketId },
      include: ESCROW_INCLUDE,
    });
  });
  return serializeEscrowTicket(updated);
}

export async function startEscrowShipping(user: AuthUser, ticketId: string) {
  const detail = await loadEscrowDetail(ticketId);
  if (!isEscrowSeller(user, detail.sellerId)) {
    throw new AppError(403, 'Only seller can start shipping', 'FORBIDDEN');
  }
  const allowed: TradeEscrowStatus[] = [
    TradeEscrowStatus.BUYER_DEPOSIT_PROOF,
    TradeEscrowStatus.ADMIN_DEPOSIT_CONFIRMED,
  ];
  if (!allowed.includes(detail.status)) {
    throw new AppError(400, 'Deposit must be submitted before shipping', 'INVALID_TRANSITION');
  }

  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId },
    include: { attachments: true },
  });
  const hasDeposit = ticket?.attachments.some(
    (a) => a.purpose === 'FIAT_DEPOSIT_RECEIPT' || a.purpose === 'USDT_TRANSFER_PROOF',
  );
  if (!hasDeposit) {
    throw new AppError(400, 'Buyer deposit proof required', 'VALIDATION_ERROR');
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    await tx.tradeEscrowDetail.update({
      where: { ticketId },
      data: { status: TradeEscrowStatus.SHIPPING_STARTED, shippingStartedAt: now },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: detail.status,
        toStatus: TradeEscrowStatus.SHIPPING_STARTED,
        changedById: user.id,
        note: '판매자 배송 시작',
      },
    });
    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: ticketId },
      include: ESCROW_INCLUDE,
    });
  });
  return serializeEscrowTicket(updated);
}

export async function approveEscrowReceipt(
  user: AuthUser,
  ticketId: string,
  input?: { sellerPayoutAccount?: string },
) {
  const detail = await loadEscrowDetail(ticketId);
  if (!isEscrowBuyer(user, detail.buyerId)) {
    throw new AppError(403, 'Only buyer can approve receipt', 'FORBIDDEN');
  }
  const allowed: TradeEscrowStatus[] = [
    TradeEscrowStatus.SHIPPING_STARTED,
    TradeEscrowStatus.SELLER_FULFILLMENT_PROOF,
  ];
  if (!allowed.includes(detail.status)) {
    throw new AppError(400, 'Shipping must be started before approval', 'INVALID_TRANSITION');
  }

  const payoutScheduledAt = schedulePayoutAt(detail.tradeTier);
  const updated = await prisma.$transaction(async (tx) => {
    await tx.tradeEscrowDetail.update({
      where: { ticketId },
      data: {
        status: TradeEscrowStatus.PAYOUT_SCHEDULED,
        payoutScheduledAt,
        ...(input?.sellerPayoutAccount && { sellerPayoutAccount: input.sellerPayoutAccount }),
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: detail.status,
        toStatus: TradeEscrowStatus.PAYOUT_SCHEDULED,
        changedById: user.id,
        note: detail.tradeTier === 'PREMIUM' ? '구매자 승인 — 당일 USDT 송금 예약' : '구매자 승인 — 익일 13시 일괄 송금 예약',
      },
    });
    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: ticketId },
      include: ESCROW_INCLUDE,
    });
  });
  return serializeEscrowTicket(updated);
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
  if (!ticket) throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  return serializeEscrowTicket(ticket);
}

export async function getEscrowDepositContext(user: AuthUser, ticketId: string) {
  const ticket = await getTradeEscrowTicket(user, ticketId);
  const receivingAccounts = await hqPolicyService.getDepositReceivingAccounts();
  const receivingAccount =
    ticket.currency !== 'USDT'
      ? receivingAccounts?.[ticket.currency as 'KRW' | 'JPY' | 'THB' | 'CNY'] ?? null
      : null;

  let registeredBank = null;
  if (user.role === UserRole.CUSTOMER) {
    const bank = await prisma.bankAccount.findFirst({
      where: { userId: user.id, isActive: true, isDefault: true },
    });
    if (bank) {
      registeredBank = {
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountHolder: bank.accountHolder,
      };
    }
  }

  return {
    ticketNo: ticket.ticketNo,
    amount: ticket.amount,
    currency: ticket.currency,
    receivingAccount,
    registeredBank,
    depositWindowHours: ESCROW_DEPOSIT_WINDOW_HOURS,
    depositDeadlineAt: ticket.depositDeadlineAt,
    isUsdtEscrow: ticket.currency === 'USDT',
    tradeTier: ticket.tradeTier,
    payoutPolicy:
      ticket.tradeTier === 'PREMIUM'
        ? 'SAME_DAY'
        : 'NEXT_DAY_13KST',
  };
}

export async function saveBuyerDepositMetadata(
  user: AuthUser,
  ticketId: string,
  input: { depositAmount?: number; depositorName?: string; depositTransferredAt?: string },
) {
  const detail = await loadEscrowDetail(ticketId);
  if (!isEscrowBuyer(user, detail.buyerId)) {
    throw new AppError(403, 'Only buyer can submit deposit metadata', 'FORBIDDEN');
  }
  if (detail.status !== TradeEscrowStatus.BUYER_DEPOSIT_PROOF) {
    throw new AppError(400, 'Deposit proof not expected at this stage', 'INVALID_STATE');
  }
  await prisma.tradeEscrowDetail.update({
    where: { ticketId },
    data: {
      ...(input.depositAmount != null && { depositAmount: input.depositAmount }),
      ...(input.depositorName && { depositorName: input.depositorName }),
      ...(input.depositTransferredAt && {
        depositTransferredAt: new Date(input.depositTransferredAt),
      }),
    },
  });
  return getTradeEscrowTicket(user, ticketId);
}

export async function transitionTradeEscrowStatus(
  user: AuthUser,
  ticketId: string,
  toStatus: TradeEscrowStatus,
  extra?: { payoutTxId?: string; sellerPayoutAccount?: string; adminNote?: string },
) {
  const { assertTicketAccess } = await import('./ticket-access.service');
  await assertTicketAccess(user, ticketId);

  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId },
    include: { tradeEscrow: true, attachments: true },
  });
  if (!ticket?.tradeEscrow) throw new AppError(404, 'Ticket not found', 'NOT_FOUND');

  const detail = ticket.tradeEscrow;
  const fromStatus = detail.status;

  if (!isAdmin(user)) {
    throw new AppError(403, 'Operator role required', 'FORBIDDEN');
  }

  if (toStatus === TradeEscrowStatus.ESCROW_COMPLETED && !extra?.payoutTxId) {
    throw new AppError(400, 'payoutTxId is required for completion', 'VALIDATION_ERROR');
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tradeEscrowDetail.update({
      where: { ticketId },
      data: {
        status: toStatus,
        ...(extra?.payoutTxId && { payoutTxId: extra.payoutTxId, payoutProcessedAt: new Date() }),
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

async function loadEscrowDetail(ticketId: string) {
  const detail = await prisma.tradeEscrowDetail.findFirst({ where: { ticketId } });
  if (!detail) throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  return detail;
}

function serializeParty(user: {
  id: string;
  name: string;
  email: string;
  customerProfile: { customerType: CustomerType; businessName: string | null } | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    customerType: user.customerProfile?.customerType ?? CustomerType.INDIVIDUAL,
    businessName: user.customerProfile?.businessName ?? null,
  };
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
    tradeTier: detail.tradeTier,
    requiresReview: detail.requiresReview,
    initiatedAsRole: detail.initiatedAsRole,
    title: detail.title,
    description: detail.description,
    escrowTerms: detail.escrowTerms,
    amount: Number(detail.amount),
    currency: detail.currency,
    totalCommissionPool: Number(detail.totalCommissionPool),
    sellerPayoutAccount: detail.sellerPayoutAccount,
    payoutTxId: detail.payoutTxId,
    payoutScheduledAt: detail.payoutScheduledAt,
    payoutProcessedAt: detail.payoutProcessedAt,
    adminNote: detail.adminNote,
    rejectionReason: detail.rejectionReason,
    voidReason: detail.voidReason,
    deliveryTerms: detail.deliveryTerms,
    deliveryDeadline: detail.deliveryDeadline,
    buyerAcceptedAt: detail.buyerAcceptedAt,
    sellerAcceptedAt: detail.sellerAcceptedAt,
    buyerDisclaimerAt: detail.buyerDisclaimerAt,
    sellerDisclaimerAt: detail.sellerDisclaimerAt,
    acceptanceDeadlineAt: detail.acceptanceDeadlineAt,
    shippingStartedAt: detail.shippingStartedAt,
    retryParentTicketId: detail.retryParentTicketId,
    retryCount: detail.retryCount,
    depositDeadlineAt: detail.depositDeadlineAt,
    depositorName: detail.depositorName,
    depositAmount: detail.depositAmount ? Number(detail.depositAmount) : null,
    depositTransferredAt: detail.depositTransferredAt,
    buyer: serializeParty(detail.buyer),
    seller: serializeParty(detail.seller),
    attachments: ticket.attachments,
    statusHistory: ticket.statusHistory,
    canRetry: detail.status === TradeEscrowStatus.VOIDED && detail.retryCount === 0,
  };
}

export { ESCROW_INCLUDE };

import {
  CardPaymentStatus,
  TicketType,
  UsdtPaymentMethod,
  UsdtPurchaseStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { buildFeeSnapshotFields } from '../lib/fee-component';
import { AuthUser } from '../types/auth';
import { isMerchantSide, merchantScopeUserId } from '../lib/merchant-role';
import { isUsdtPayMethodAllowed } from '../lib/usdt-pay-method-access';
import { WalletApprovalStatus } from '@prisma/client';
import {
  calculateExpectedUsdtRange,
  fetchUsdtFiatRate,
  type FiatCurrency,
} from './exchange-rate.service';
import { hqPolicyService } from './hq-policy.service';
import {
  assertCardPaymentAvailable,
  getCardPaymentConfig,
  getIcopayConfig,
  validateCardChargeAmount,
} from './card-payment-policy.service';
import { quoteCardFromTarget, splitCardCharge } from './card-fee.service';
import {
  getIcopayCheckoutStatus,
  isIcopayFailedStatus,
  isIcopayPaidStatus,
  parseIcopayWebhookBody,
  prepareIcopayCheckout,
  type IcopayBuyerInput,
} from './icopay.service';
import {
  breakdownFromFiat,
  resolveFeesForPurchase,
  type ResolvedTransactionFees,
} from './usdt-fee-breakdown.service';
import { validateCustomerTransactionAmount } from './transaction-limit.service';
import { validateUsdtRiskLimitAmount } from './usdt-risk-limit.service';
import {
  previewUsdtTransactionFees,
  USDT_PURCHASE_INCLUDE,
  serializeTicket,
} from './usdt-purchase.service';
import { getWorkflowDisplay } from './workflow-display.service';
import { assertCustomerKycApproved } from './kyc.service';

function generateTicketNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `USDT-${date}-${rand}`;
}

async function assertCustomerCardPayAllowed(user: AuthUser) {
  if (!user.customerProfileId) return;
  const profile = await prisma.customerProfile.findUnique({
    where: { id: user.customerProfileId },
    select: { customerType: true, usdtPayCardMode: true },
  });
  if (
    !isUsdtPayMethodAllowed({
      mode: profile?.usdtPayCardMode,
      method: 'CARD',
      customerType: profile?.customerType,
    })
  ) {
    throw new AppError(400, 'Card payment is disabled for this customer', 'CUSTOMER_CARD_DISABLED');
  }
}

export async function getUsdtCardPaymentContext(user: AuthUser) {
  const [card, icopay, currencyTrade] = await Promise.all([
    getCardPaymentConfig(),
    import('./card-payment-policy.service').then((m) => m.getIcopayConfigMasked()),
    hqPolicyService.getUsdtCurrencyTradePolicy(),
  ]);
  const dbUser =
    user.role === UserRole.CUSTOMER || user.role === UserRole.CUSTOMER_OPERATOR
      ? await prisma.user.findUnique({
          where: { id: merchantScopeUserId(user) },
          select: {
            phone: true,
            phoneCountryCode: true,
            email: true,
            name: true,
            customerProfile: {
              select: {
                customerType: true,
                usdtPayCardMode: true,
              },
            },
          },
        })
      : null;
  const customerCardAllowed = isUsdtPayMethodAllowed({
    mode: dbUser?.customerProfile?.usdtPayCardMode,
    method: 'CARD',
    customerType: dbUser?.customerProfile?.customerType,
  });
  return {
    cardPaymentEnabled: card.enabled && customerCardAllowed,
    enabled:
      card.enabled &&
      customerCardAllowed &&
      icopay.enabled &&
      Boolean(String(icopay.compId || icopay.mid || '').trim()),
    cardFeePercent: card.cardFeePercent,
    limits: card.limits,
    currencyTrade,
    icopayConfigured: Boolean(String(icopay.compId || icopay.mid || '').trim()),
    webhookUrl: 'https://api.tinpass.com/api/webhooks/icopay',
    resultUrl: 'https://tinpass.com/dashboard/usdt',
    userPhone: dbUser?.phone ?? null,
    userPhoneCountryCode: dbUser?.phoneCountryCode ?? null,
    userEmail: dbUser?.email ?? null,
    userName: dbUser?.name ?? null,
  };
}

export async function previewUsdtCardFees(
  user: AuthUser,
  input: {
    walletId: string;
    fiatCurrency?: FiatCurrency;
    targetUsdtAmount?: number;
    cardChargeFiat?: number;
  },
) {
  const cardConfig = await getCardPaymentConfig();
  if (!cardConfig.enabled) {
    throw new AppError(503, 'Card payment is not enabled', 'CARD_DISABLED');
  }
  await assertCustomerCardPayAllowed(user);
  const currency = input.fiatCurrency ?? 'JPY';
  await hqPolicyService.assertUsdtFiatMethodEnabled(currency, 'CARD');

  if (input.cardChargeFiat != null && input.cardChargeFiat > 0) {
    const { cardFeeFiat, fiatForConversion } = splitCardCharge(
      input.cardChargeFiat,
      cardConfig.cardFeePercent,
    );
    const base = await previewUsdtTransactionFees(user, {
      walletId: input.walletId,
      fiatCurrency: input.fiatCurrency,
      fiatAmount: fiatForConversion,
    });
    validateCardChargeAmount(cardConfig, currency, input.cardChargeFiat);
    return {
      ...base,
      paymentMethod: 'CARD' as const,
      cardFeePercent: cardConfig.cardFeePercent,
      cardFeeFiat,
      cardChargeFiat: input.cardChargeFiat,
      fiatForConversion,
      /** ICOPAY prepare = display currency/amount (e.g. JPY) */
      cardPayCurrency: currency,
      cardPayAmount: input.cardChargeFiat,
    };
  }

  const base = await previewUsdtTransactionFees(user, {
    walletId: input.walletId,
    fiatCurrency: input.fiatCurrency,
    targetUsdtAmount: input.targetUsdtAmount,
  });
  if (!base.breakdown) {
    return {
      ...base,
      paymentMethod: 'CARD' as const,
      cardFeePercent: cardConfig.cardFeePercent,
      cardFeeFiat: 0,
      cardChargeFiat: 0,
      fiatForConversion: base.fiatAmount,
      cardPayCurrency: currency,
      cardPayAmount: 0,
    };
  }
  const cardQuote = quoteCardFromTarget(
    {
      requiredFiat: base.breakdown.requiredFiat,
      netUsdt: base.breakdown.netUsdt,
      grossUsdt: base.breakdown.grossUsdt,
      fxFeeUsdt: base.breakdown.fxFeeUsdt,
      gasFeeUsdt: base.breakdown.gasFeeUsdt,
      transferFeeUsdt: base.breakdown.transferFeeUsdt,
      otherFeeUsdt: base.breakdown.otherFeeUsdt,
    },
    cardConfig.cardFeePercent,
  );
  validateCardChargeAmount(cardConfig, currency, cardQuote.cardChargeFiat);
  return {
    ...base,
    paymentMethod: 'CARD' as const,
    cardFeePercent: cardQuote.cardFeePercent,
    cardFeeFiat: cardQuote.cardFeeFiat,
    cardChargeFiat: cardQuote.cardChargeFiat,
    fiatForConversion: cardQuote.fiatForConversion,
    cardPayCurrency: currency,
    cardPayAmount: cardQuote.cardChargeFiat,
  };
}

export async function createUsdtCardPurchase(
  user: AuthUser,
  input: {
    walletId: string;
    fiatCurrency?: FiatCurrency;
    targetUsdtAmount?: number;
    cardChargeFiat?: number;
    card: IcopayBuyerInput;
    cardWaiverAccepted: boolean;
    lang?: string;
  },
) {
  if (!isMerchantSide(user) || !user.customerProfileId) {
    throw new AppError(403, 'Only customers can create purchase tickets', 'FORBIDDEN');
  }
  await assertCustomerKycApproved(merchantScopeUserId(user));
  await assertCustomerCardPayAllowed(user);
  if (!input.cardWaiverAccepted) {
    throw new AppError(400, 'Card payment waiver must be accepted', 'WAIVER_REQUIRED');
  }
  if (!input.targetUsdtAmount && !input.cardChargeFiat) {
    throw new AppError(400, 'targetUsdtAmount or cardChargeFiat is required', 'VALIDATION');
  }

  const { card: cardPolicy, icopay } = await assertCardPaymentAvailable();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true, phoneCountryCode: true, email: true, name: true },
  });
  if (!dbUser?.phone?.trim() || !dbUser.phoneCountryCode?.trim()) {
    throw new AppError(400, 'Phone number with country code is required', 'PHONE_REQUIRED');
  }

  const wallet = await prisma.wallet.findFirst({
    where: {
      id: input.walletId,
      userId: merchantScopeUserId(user),
      isActive: true,
      approvalStatus: WalletApprovalStatus.APPROVED,
      deleteRequestedAt: null,
    },
  });
  if (!wallet) {
    throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
  }

  const sessionPolicy = await hqPolicyService.getSessionPolicy();
  const currency = input.fiatCurrency ?? sessionPolicy.defaultUsdtFiatCurrency ?? 'JPY';
  await hqPolicyService.assertUsdtFiatMethodEnabled(currency, 'CARD');
  const { rate, source, fetchedAt } = await fetchUsdtFiatRate(currency);

  let fiatAmount: number;
  let cardChargeFiat: number;
  let cardFeeFiat: number;
  let expected: number;
  let min: number;
  let max: number;
  let targetUsdt: number | null = null;
  let fees: ResolvedTransactionFees;
  let feeBreakdown: ReturnType<typeof breakdownFromFiat> | null = null;

  if (input.cardChargeFiat != null && input.cardChargeFiat > 0) {
    const split = splitCardCharge(input.cardChargeFiat, cardPolicy.cardFeePercent);
    cardChargeFiat = input.cardChargeFiat;
    cardFeeFiat = split.cardFeeFiat;
    fiatAmount = split.fiatForConversion;
    validateCardChargeAmount(cardPolicy, currency, cardChargeFiat);
    if (rate > 0) {
      await validateUsdtRiskLimitAmount({
        customerProfileId: user.customerProfileId,
        usdtAmount: fiatAmount / rate,
        fiatCurrency: currency,
        exchangeRate: rate,
      });
    }
    fees = await resolveFeesForPurchase(wallet, currency, fiatAmount, rate, {
      customerProfileId: user.customerProfileId,
    });
    feeBreakdown = breakdownFromFiat(fiatAmount, rate, fees);
    expected = feeBreakdown.netUsdt;
    const range = calculateExpectedUsdtRange(fiatAmount, rate, fees);
    min = range.min;
    max = range.max;
  } else {
    await validateUsdtRiskLimitAmount({
      customerProfileId: user.customerProfileId,
      usdtAmount: Number(input.targetUsdtAmount),
      fiatCurrency: currency,
      exchangeRate: rate,
    });
    const preview = await previewUsdtCardFees(user, {
      walletId: input.walletId,
      fiatCurrency: currency,
      targetUsdtAmount: input.targetUsdtAmount,
    });
    if (!preview.breakdown || preview.cardChargeFiat == null) {
      throw new AppError(400, 'Unable to quote card payment', 'VALIDATION');
    }
    fiatAmount = preview.fiatForConversion ?? preview.fiatAmount;
    cardChargeFiat = preview.cardChargeFiat;
    cardFeeFiat = preview.cardFeeFiat ?? 0;
    expected = preview.breakdown.netUsdt;
    targetUsdt = preview.breakdown.netUsdt;
    fees = preview.fees;
    feeBreakdown = preview.breakdown;
    const range = calculateExpectedUsdtRange(fiatAmount, rate, fees);
    min = range.min;
    max = range.max;
  }

  const customerProfile = await prisma.customerProfile.findUnique({
    where: { id: user.customerProfileId },
    select: { customerType: true },
  });
  if (!customerProfile) {
    throw new AppError(404, 'Customer profile not found', 'NOT_FOUND');
  }

  await validateCustomerTransactionAmount({
    customerId: user.customerProfileId,
    customerType: customerProfile.customerType,
    currency,
    fiatAmount,
  });

  const orderId = generateTicketNo();
  const waiverAt = new Date();
  const feeSnapshots = buildFeeSnapshotFields(fees, {
    fxFeeUsdt: feeBreakdown?.fxFeeUsdt ?? 0,
    gasFeeUsdt: feeBreakdown?.gasFeeUsdt ?? 0,
    transferFeeUsdt: feeBreakdown?.transferFeeUsdt ?? 0,
    otherFeeUsdt: feeBreakdown?.baseOtherFeeUsdt ?? feeBreakdown?.otherFeeUsdt ?? 0,
  });

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.transactionTicket.create({
      data: {
        ticketNo: orderId,
        type: TicketType.USDT_PURCHASE,
        customerId: user.customerProfileId!,
        usdtPurchase: {
          create: {
            status: UsdtPurchaseStatus.CARD_PAYMENT_PENDING,
            paymentMethod: UsdtPaymentMethod.CARD,
            fiatAmount,
            fiatCurrency: currency,
            exchangeRate: rate,
            exchangeRateAt: fetchedAt,
            exchangeSource: source,
            expectedUsdtAmount: expected,
            expectedUsdtMin: min,
            expectedUsdtMax: max,
            targetUsdtAmount: targetUsdt,
            depositDeadlineAt: null,
            ...feeSnapshots,
            cardFeePercentSnapshot: cardPolicy.cardFeePercent,
            cardFeeFiatSnapshot: cardFeeFiat,
            cardChargeFiat,
            /** ICOPAY charge = display currency/amount (JPY stays JPY) */
            cardPayCurrency: currency,
            cardPayAmount: cardChargeFiat,
            cardPayCrossRate: 1,
            cardPayUsdtRate: rate,
            cardPaymentStatus: CardPaymentStatus.PENDING,
            cardWaiverAcceptedAt: waiverAt,
            icopayOrderId: orderId,
            walletId: wallet.id,
            walletAddressSnapshot: wallet.address,
            walletNetworkSnapshot: wallet.network,
          },
        },
      },
      include: USDT_PURCHASE_INCLUDE,
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: created.id,
        fromStatus: null,
        toStatus: UsdtPurchaseStatus.CARD_PAYMENT_PENDING,
        changedById: user.id,
        note: `카드 결제 처리 중 (${currency})`,
      },
    });

    return created;
  });

  try {
    const checkout = await prepareIcopayCheckout(icopay, {
      orderNo: orderId,
      amount: cardChargeFiat,
      currency,
      productName: `TINPASS USDT ${orderId}`,
      lang: input.lang,
      buyer: {
        email: input.card.email || dbUser.email,
        phone: input.card.phone || dbUser.phone!,
        phoneCountryCode: input.card.phoneCountryCode || dbUser.phoneCountryCode!,
        cardholderName: input.card.cardholderName || dbUser.name || 'TINPASS Buyer',
        firstName: input.card.firstName,
        lastName: input.card.lastName,
      },
    });

    await prisma.usdtPurchaseDetail.update({
      where: { ticketId: ticket.id },
      data: {
        icopayTransactionId: checkout.sessionId || null,
      },
    });

    const serialized = serializeTicket(ticket, (await getWorkflowDisplay()).sla);
    return {
      ...serialized,
      icopayCheckout: {
        payUrl: checkout.payUrl,
        sessionId: checkout.sessionId,
        sessionToken: checkout.sessionToken,
        embedScriptUrl: checkout.embedScriptUrl,
        expiresAt: checkout.expiresAt,
        integrationMode: checkout.integrationMode,
        orderNo: checkout.orderNo,
        payCurrency: currency,
        payAmount: cardChargeFiat,
      },
    };
  } catch (err) {
    const reason = err instanceof AppError ? err.message : 'Card payment prepare failed';
    await prisma.$transaction(async (tx) => {
      await tx.usdtPurchaseDetail.update({
        where: { ticketId: ticket.id },
        data: {
          status: UsdtPurchaseStatus.CANCELLED,
          cardPaymentStatus: CardPaymentStatus.DECLINED,
          cancelReason: reason,
        },
      });
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: UsdtPurchaseStatus.CARD_PAYMENT_PENDING,
          toStatus: UsdtPurchaseStatus.CANCELLED,
          changedById: user.id,
          note: reason,
        },
      });
    });
    throw err instanceof AppError ? err : new AppError(502, reason, 'ICOPAY_PREPARE_FAILED');
  }
}

async function resolveStatusActorUserId(ticketId: string, preferred?: string | null): Promise<string> {
  if (preferred) return preferred;
  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId },
    select: {
      customer: { select: { userId: true } },
    },
  });
  if (ticket?.customer?.userId) return ticket.customer.userId;
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN, isActive: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin) throw new AppError(500, 'No actor user for status history', 'NO_ACTOR');
  return admin.id;
}

async function applyCardPaymentOutcome(opts: {
  ticketId: string;
  orderNo: string;
  paid: boolean;
  transactionId?: string;
  last4?: string;
  note: string;
  actorUserId?: string | null;
}) {
  const detail = await prisma.usdtPurchaseDetail.findUnique({
    where: { ticketId: opts.ticketId },
    select: { status: true, cardPaymentStatus: true },
  });
  if (!detail) return null;
  const actorUserId = await resolveStatusActorUserId(opts.ticketId, opts.actorUserId);
  if (
    detail.cardPaymentStatus === CardPaymentStatus.APPROVED ||
    detail.status === UsdtPurchaseStatus.ADMIN_REVIEWING ||
    detail.status === UsdtPurchaseStatus.COMPLETED
  ) {
    return prisma.transactionTicket.findUnique({
      where: { id: opts.ticketId },
      include: USDT_PURCHASE_INCLUDE,
    });
  }

  if (opts.paid) {
    return prisma.$transaction(async (tx) => {
      await tx.usdtPurchaseDetail.update({
        where: { ticketId: opts.ticketId },
        data: {
          status: UsdtPurchaseStatus.ADMIN_REVIEWING,
          cardPaymentStatus: CardPaymentStatus.APPROVED,
          icopayTransactionId: opts.transactionId || opts.orderNo,
          cardLast4: opts.last4 || null,
        },
      });
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: opts.ticketId,
          fromStatus: detail.status,
          toStatus: UsdtPurchaseStatus.ADMIN_REVIEWING,
          changedById: actorUserId,
          note: opts.note,
        },
      });
      return tx.transactionTicket.findUniqueOrThrow({
        where: { id: opts.ticketId },
        include: USDT_PURCHASE_INCLUDE,
      });
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.usdtPurchaseDetail.update({
      where: { ticketId: opts.ticketId },
      data: {
        status: UsdtPurchaseStatus.CANCELLED,
        cardPaymentStatus: CardPaymentStatus.DECLINED,
        cancelReason: opts.note,
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId: opts.ticketId,
        fromStatus: detail.status,
        toStatus: UsdtPurchaseStatus.CANCELLED,
        changedById: actorUserId,
        note: opts.note,
      },
    });
    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: opts.ticketId },
      include: USDT_PURCHASE_INCLUDE,
    });
  });
}

/** ICOPAY → merchant webhook */
export async function handleIcopayWebhook(body: unknown) {
  const parsed = parseIcopayWebhookBody(body);
  if (!parsed.orderNo) {
    return { success: false, error: 'orderNo missing' };
  }
  const ticket = await prisma.transactionTicket.findFirst({
    where: {
      OR: [
        { ticketNo: parsed.orderNo },
        { usdtPurchase: { icopayOrderId: parsed.orderNo } },
      ],
    },
    include: { usdtPurchase: true },
  });
  if (!ticket?.usdtPurchase) {
    return { success: true, ignored: true, reason: 'ticket not found' };
  }
  if (ticket.usdtPurchase.paymentMethod !== UsdtPaymentMethod.CARD) {
    return { success: true, ignored: true, reason: 'not card ticket' };
  }

  const status = parsed.paymentStatus || 'UNKNOWN';
  if (isIcopayPaidStatus(status) || String(status).toUpperCase() === 'Y') {
    const expectedPay = ticket.usdtPurchase.cardPayAmount
      ? Number(ticket.usdtPurchase.cardPayAmount)
      : ticket.usdtPurchase.cardChargeFiat
        ? Number(ticket.usdtPurchase.cardChargeFiat)
        : null;
    if (
      expectedPay != null &&
      parsed.amount != null &&
      Number.isFinite(parsed.amount) &&
      Math.abs(parsed.amount - expectedPay) > Math.max(1, expectedPay * 0.01)
    ) {
      return {
        success: true,
        pending: true,
        orderNo: parsed.orderNo,
        paymentStatus: status,
        reason: `amount mismatch webhook=${parsed.amount} expected=${expectedPay} ${ticket.usdtPurchase.cardPayCurrency || ticket.usdtPurchase.fiatCurrency}`,
      };
    }
    await applyCardPaymentOutcome({
      ticketId: ticket.id,
      orderNo: parsed.orderNo,
      paid: true,
      transactionId: parsed.transactionId,
      last4: parsed.last4,
      note: `ICOPAY webhook 승인 (${parsed.transactionId || status})`,
    });
    return { success: true, orderNo: parsed.orderNo, paymentStatus: 'APPROVED' };
  }
  if (isIcopayFailedStatus(status) && status !== 'NOT_FOUND') {
    await applyCardPaymentOutcome({
      ticketId: ticket.id,
      orderNo: parsed.orderNo,
      paid: false,
      note: `ICOPAY webhook 거절 (${status})`,
    });
    return { success: true, orderNo: parsed.orderNo, paymentStatus: 'DECLINED' };
  }
  return { success: true, pending: true, orderNo: parsed.orderNo, paymentStatus: status };
}

/** Status API 폴링 — 브라우저 복귀 후 결제 확정 */
export async function syncUsdtCardPayment(user: AuthUser, ticketId: string) {
  const ticket = await prisma.transactionTicket.findFirst({
    where: { id: ticketId },
    include: USDT_PURCHASE_INCLUDE,
  });
  if (!ticket?.usdtPurchase) {
    throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  }
  if (isMerchantSide(user) && ticket.customerId !== user.customerProfileId) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  const detail = ticket.usdtPurchase;
  if (detail.paymentMethod !== UsdtPaymentMethod.CARD) {
    throw new AppError(400, 'Not a card payment ticket', 'VALIDATION');
  }
  if (
    detail.cardPaymentStatus === CardPaymentStatus.APPROVED ||
    detail.status === UsdtPurchaseStatus.ADMIN_REVIEWING ||
    detail.status === UsdtPurchaseStatus.COMPLETED
  ) {
    return serializeTicket(ticket, (await getWorkflowDisplay()).sla);
  }
  if (detail.status !== UsdtPurchaseStatus.CARD_PAYMENT_PENDING) {
    return serializeTicket(ticket, (await getWorkflowDisplay()).sla);
  }

  const icopay = await getIcopayConfig();
  const orderNo = detail.icopayOrderId || ticket.ticketNo;
  const status = await getIcopayCheckoutStatus(icopay, orderNo, detail.icopayTransactionId);
  if (isIcopayPaidStatus(status.paymentStatus)) {
    const updated = await applyCardPaymentOutcome({
      ticketId: ticket.id,
      orderNo,
      paid: true,
      transactionId: status.transactionId,
      last4: status.last4,
      note: `ICOPAY status 승인 (${status.transactionId || status.paymentStatus})`,
      actorUserId: user.id,
    });
    if (updated) return serializeTicket(updated, (await getWorkflowDisplay()).sla);
  }
  if (isIcopayFailedStatus(status.paymentStatus) && status.paymentStatus !== 'NOT_FOUND') {
    const updated = await applyCardPaymentOutcome({
      ticketId: ticket.id,
      orderNo,
      paid: false,
      note: `ICOPAY status 거절 (${status.paymentStatus})`,
      actorUserId: user.id,
    });
    if (updated) return serializeTicket(updated, (await getWorkflowDisplay()).sla);
  }
  return serializeTicket(ticket, (await getWorkflowDisplay()).sla);
}

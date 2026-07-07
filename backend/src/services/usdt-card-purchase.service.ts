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
import {
  calculateExpectedUsdtRange,
  fetchUsdtFiatRate,
  type FiatCurrency,
} from './exchange-rate.service';
import { hqPolicyService } from './hq-policy.service';
import {
  assertCardPaymentAvailable,
  getCardPaymentConfig,
  validateCardChargeAmount,
} from './card-payment-policy.service';
import { quoteCardFromTarget, splitCardCharge } from './card-fee.service';
import { chargeIcopayCard, type IcopayCardInput } from './icopay.service';
import {
  breakdownFromFiat,
  resolveFeesForPurchase,
  type ResolvedTransactionFees,
} from './usdt-fee-breakdown.service';
import { validateCustomerTransactionAmount } from './transaction-limit.service';
import {
  previewUsdtTransactionFees,
  USDT_PURCHASE_INCLUDE,
  serializeTicket,
} from './usdt-purchase.service';

function generateTicketNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `USDT-${date}-${rand}`;
}

export async function getUsdtCardPaymentContext(user: AuthUser) {
  const [card, icopay] = await Promise.all([
    getCardPaymentConfig(),
    import('./card-payment-policy.service').then((m) => m.getIcopayConfigMasked()),
  ]);
  const dbUser =
    user.role === UserRole.CUSTOMER
      ? await prisma.user.findUnique({
          where: { id: user.id },
          select: { phone: true, phoneCountryCode: true, email: true, name: true },
        })
      : null;
  return {
    cardPaymentEnabled: card.enabled,
    enabled: card.enabled && icopay.enabled && Boolean(icopay.mid),
    cardFeePercent: card.cardFeePercent,
    limits: card.limits,
    icopayConfigured: Boolean(icopay.mid),
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
    const currency = input.fiatCurrency ?? 'JPY';
    validateCardChargeAmount(cardConfig, currency, input.cardChargeFiat);
    return {
      ...base,
      paymentMethod: 'CARD' as const,
      cardFeePercent: cardConfig.cardFeePercent,
      cardFeeFiat,
      cardChargeFiat: input.cardChargeFiat,
      fiatForConversion,
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
  const currency = input.fiatCurrency ?? 'JPY';
  validateCardChargeAmount(cardConfig, currency, cardQuote.cardChargeFiat);
  return {
    ...base,
    paymentMethod: 'CARD' as const,
    cardFeePercent: cardQuote.cardFeePercent,
    cardFeeFiat: cardQuote.cardFeeFiat,
    cardChargeFiat: cardQuote.cardChargeFiat,
    fiatForConversion: cardQuote.fiatForConversion,
  };
}

export async function createUsdtCardPurchase(
  user: AuthUser,
  input: {
    walletId: string;
    fiatCurrency?: FiatCurrency;
    targetUsdtAmount?: number;
    cardChargeFiat?: number;
    card: IcopayCardInput;
    cardWaiverAccepted: boolean;
  },
) {
  if (user.role !== UserRole.CUSTOMER || !user.customerProfileId) {
    throw new AppError(403, 'Only customers can create purchase tickets', 'FORBIDDEN');
  }
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
    where: { id: input.walletId, userId: user.id, isActive: true },
  });
  if (!wallet) {
    throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
  }

  const sessionPolicy = await hqPolicyService.getSessionPolicy();
  const currency = input.fiatCurrency ?? sessionPolicy.defaultUsdtFiatCurrency ?? 'JPY';
  const { rate, source, fetchedAt } = await fetchUsdtFiatRate(currency);

  let fiatAmount: number;
  let cardChargeFiat: number;
  let cardFeeFiat: number;
  let expected: number;
  let min: number;
  let max: number;
  let targetUsdt: number | null = null;
  let fees: ResolvedTransactionFees;
  let localPremiumSnapshot = null;
  let feeBreakdown: ReturnType<typeof breakdownFromFiat> | null = null;

  if (input.cardChargeFiat != null && input.cardChargeFiat > 0) {
    const split = splitCardCharge(input.cardChargeFiat, cardPolicy.cardFeePercent);
    cardChargeFiat = input.cardChargeFiat;
    cardFeeFiat = split.cardFeeFiat;
    fiatAmount = split.fiatForConversion;
    validateCardChargeAmount(cardPolicy, currency, cardChargeFiat);
    fees = await resolveFeesForPurchase(wallet, currency, fiatAmount, rate);
    feeBreakdown = breakdownFromFiat(fiatAmount, rate, fees);
    expected = feeBreakdown.netUsdt;
    const range = calculateExpectedUsdtRange(fiatAmount, rate, fees);
    min = range.min;
    max = range.max;
  } else {
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
            cardPaymentStatus: CardPaymentStatus.PENDING,
            cardWaiverAcceptedAt: waiverAt,
            icopayOrderId: orderId,
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
        toStatus: UsdtPurchaseStatus.CARD_PAYMENT_PENDING,
        changedById: user.id,
        note: '카드 결제 처리 중',
      },
    });

    return created;
  });

  try {
    const charge = await chargeIcopayCard(icopay, {
      orderId,
      amount: cardChargeFiat,
      currency,
      description: `USDT purchase ${orderId}`,
      card: {
        ...input.card,
        email: input.card.email || dbUser.email,
        phone: input.card.phone || dbUser.phone!,
        phoneCountryCode: input.card.phoneCountryCode || dbUser.phoneCountryCode!,
      },
    });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.usdtPurchaseDetail.update({
        where: { ticketId: ticket.id },
        data: {
          status: UsdtPurchaseStatus.ADMIN_REVIEWING,
          cardPaymentStatus: CardPaymentStatus.APPROVED,
          icopayTransactionId: charge.transactionId,
          cardLast4: charge.last4,
        },
      });
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: UsdtPurchaseStatus.CARD_PAYMENT_PENDING,
          toStatus: UsdtPurchaseStatus.ADMIN_REVIEWING,
          changedById: user.id,
          note: `ICOPAY 승인 (${charge.transactionId})`,
        },
      });
      return tx.transactionTicket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: USDT_PURCHASE_INCLUDE,
      });
    });

    return serializeTicket(updated);
  } catch (err) {
    const reason = err instanceof AppError ? err.message : 'Card payment failed';
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
    throw err;
  }
}

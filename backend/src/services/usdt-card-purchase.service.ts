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
  resolveCardFeePercent,
  validateCardChargeAmount,
} from './card-payment-policy.service';
import { quoteCardFromTarget, splitCardCharge } from './card-fee.service';
import {
  completeIcopaySandboxCheckout,
  getIcopayCheckoutStatus,
  ICOPAY_BROWSER_RESULT_URL,
  isIcopayPaidStatus,
  isIcopayTerminalFailedStatus,
  parseIcopayWebhookBody,
  prepareIcopayCheckout,
  type IcopayBuyerInput,
} from './icopay.service';
import {
  breakdownFromFiat,
  resolveFeesForPurchase,
  type ResolvedTransactionFees,
} from './usdt-fee-breakdown.service';
import {
  getCustomerTransactionLimitSummary,
  validateCustomerTransactionAmount,
} from './transaction-limit.service';
import { validateUsdtRiskLimitAmount } from './usdt-risk-limit.service';
import {
  previewUsdtTransactionFees,
  USDT_PURCHASE_INCLUDE,
  serializeTicket,
} from './usdt-purchase.service';
import { getWorkflowDisplay } from './workflow-display.service';
import { assertCustomerKycApproved } from './kyc.service';
import { getSettlementAsset } from './settlement-asset.service';

/** ICOPAY orderNo: digits only (no USDT/USD/crypto terms or letters) */
function generateTicketNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 1e10)
    .toString()
    .padStart(10, '0');
  return `${date}${rand}`;
}

const ENGLISH_LEGAL_NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;

function normalizeLegalNamePart(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

async function assertCustomerCardPayAllowed(user: AuthUser) {
  if (!user.customerProfileId) return;
  const profile = await prisma.customerProfile.findUnique({
    where: { id: user.customerProfileId },
    select: { customerType: true, usdtPayCardMode: true },
  });
  const hqCard = await hqPolicyService.hqServiceMethodEnabled('CARD', profile?.customerType);
  if (
    !isUsdtPayMethodAllowed({
      mode: profile?.usdtPayCardMode,
      method: 'CARD',
      customerType: profile?.customerType,
      hqMethodAllowed: hqCard,
    })
  ) {
    throw new AppError(400, 'Card payment is disabled for this customer', 'CUSTOMER_CARD_DISABLED');
  }
}

export async function getUsdtCardPaymentContext(user: AuthUser) {
  const dbUser =
    user.role === UserRole.CUSTOMER || user.role === UserRole.CUSTOMER_OPERATOR
      ? await prisma.user.findUnique({
          where: { id: merchantScopeUserId(user) },
          select: {
            phone: true,
            phoneCountryCode: true,
            email: true,
            name: true,
            legalFirstName: true,
            legalLastName: true,
            customerProfile: {
              select: {
                customerType: true,
                usdtPayCardMode: true,
              },
            },
          },
        })
      : null;
  const customerType = dbUser?.customerProfile?.customerType ?? null;
  const [card, icopay, currencyTrade, hqCard] = await Promise.all([
    getCardPaymentConfig(),
    import('./card-payment-policy.service').then((m) => m.getIcopayConfigMasked()),
    hqPolicyService.getUsdtCurrencyTradePolicy(customerType),
    hqPolicyService.hqServiceMethodEnabled('CARD', customerType),
  ]);
  const customerCardAllowed = isUsdtPayMethodAllowed({
    mode: dbUser?.customerProfile?.usdtPayCardMode,
    method: 'CARD',
    customerType,
    hqMethodAllowed: hqCard,
  });
  const risk = await import('./transaction-fee.service').then((m) => m.getCommissionRiskConfig());
  const typeKey = customerType === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL';
  const cardRisk =
    risk.methodTransactionLimits?.CARD?.[typeKey] ?? risk.transactionLimits[typeKey];
  const limitsFromRisk = Object.fromEntries(
    (['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'] as const).map((c) => [
      c,
      {
        min: Number(cardRisk[c]?.perTransactionMin) || 0,
        max: Number(cardRisk[c]?.perTransactionMax) || 0,
      },
    ]),
  ) as typeof card.limits;

  return {
    cardPaymentEnabled: card.enabled && customerCardAllowed,
    enabled:
      card.enabled &&
      customerCardAllowed &&
      icopay.enabled &&
      Boolean(String(icopay.compId || icopay.mid || '').trim()),
    cardFeePercent: card.cardFeePercent,
    cardFeeMode: card.cardFeeMode,
    cardFeeByBrand: card.cardFeeByBrand,
    limits: limitsFromRisk,
    currencyTrade,
    icopayConfigured: Boolean(String(icopay.compId || icopay.mid || '').trim()),
    webhookUrl: 'https://api.tinpass.com/api/webhooks/icopay',
    resultUrl: ICOPAY_BROWSER_RESULT_URL,
    userPhone: dbUser?.phone ?? null,
    userPhoneCountryCode: dbUser?.phoneCountryCode ?? null,
    userEmail: dbUser?.email ?? null,
    userName: dbUser?.name ?? null,
    legalFirstName: dbUser?.legalFirstName ?? null,
    legalLastName: dbUser?.legalLastName ?? null,
    legalNameLocked: Boolean(
      normalizeLegalNamePart(dbUser?.legalFirstName) &&
        normalizeLegalNamePart(dbUser?.legalLastName),
    ),
  };
}

export async function previewUsdtCardFees(
  user: AuthUser,
  input: {
    walletId: string;
    fiatCurrency?: FiatCurrency;
    targetUsdtAmount?: number;
    cardChargeFiat?: number;
    cardBrand?: string | null;
  },
) {
  const cardConfig = await getCardPaymentConfig();
  if (!cardConfig.enabled) {
    throw new AppError(503, 'Card payment is not enabled', 'CARD_DISABLED');
  }
  await assertCustomerCardPayAllowed(user);
  const currency = input.fiatCurrency ?? 'JPY';
  const feePercent = resolveCardFeePercent(cardConfig, input.cardBrand);
  const profileType = user.customerProfileId
    ? (
        await prisma.customerProfile.findUnique({
          where: { id: user.customerProfileId },
          select: { customerType: true },
        })
      )?.customerType
    : null;
  await hqPolicyService.assertUsdtFiatMethodEnabled(currency, 'CARD', profileType);

  if (input.cardChargeFiat != null && input.cardChargeFiat > 0) {
    const { cardFeeFiat, fiatForConversion } = splitCardCharge(
      input.cardChargeFiat,
      feePercent,
    );
    await validateCardChargeAmount(currency, input.cardChargeFiat, profileType);
    const base = await previewUsdtTransactionFees(user, {
      walletId: input.walletId,
      fiatCurrency: input.fiatCurrency,
      fiatAmount: fiatForConversion,
      paymentMethod: 'CARD',
      /** 한도는 카드 결제액 기준 (수수료 차감 전) */
      limitFiatAmount: input.cardChargeFiat,
    });
    return {
      ...base,
      paymentMethod: 'CARD' as const,
      cardFeePercent: feePercent,
      cardFeeMode: cardConfig.cardFeeMode,
      cardBrand: input.cardBrand ?? null,
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
    paymentMethod: 'CARD',
    /** 결제액(수수료 포함) 산출 후 카드 한도로 검증 */
    skipLimitValidation: true,
  });
  if (!base.breakdown) {
    return {
      ...base,
      paymentMethod: 'CARD' as const,
      cardFeePercent: feePercent,
      cardFeeMode: cardConfig.cardFeeMode,
      cardBrand: input.cardBrand ?? null,
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
    feePercent,
  );
  await validateCardChargeAmount(currency, cardQuote.cardChargeFiat, profileType);
  /** 희망 USDT 경로: 카드 결제액으로 카드 한도 검증 */
  let transactionLimits = base.transactionLimits;
  if (user.customerProfileId) {
    const { rate } = await fetchUsdtFiatRate(currency);
    if (rate > 0) {
      await validateUsdtRiskLimitAmount({
        customerProfileId: user.customerProfileId,
        usdtAmount: cardQuote.fiatForConversion / rate,
        fiatCurrency: currency,
        exchangeRate: rate,
        fiatAmount: cardQuote.cardChargeFiat,
        paymentMethod: 'CARD',
      });
    }
    const profile = await prisma.customerProfile.findUnique({
      where: { id: user.customerProfileId },
      select: { customerType: true },
    });
    if (profile) {
      await validateCustomerTransactionAmount({
        customerId: user.customerProfileId,
        customerType: profile.customerType,
        currency,
        fiatAmount: cardQuote.cardChargeFiat,
        paymentMethod: 'CARD',
      });
      transactionLimits = await getCustomerTransactionLimitSummary(
        user.customerProfileId,
        profile.customerType,
        currency,
        'CARD',
      );
    }
  }
  return {
    ...base,
    transactionLimits,
    paymentMethod: 'CARD' as const,
    cardFeePercent: cardQuote.cardFeePercent,
    cardFeeMode: cardConfig.cardFeeMode,
    cardBrand: input.cardBrand ?? null,
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
    cardBrand?: string | null;
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
  const feePercent = resolveCardFeePercent(cardPolicy, input.cardBrand);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      phone: true,
      phoneCountryCode: true,
      email: true,
      name: true,
      legalFirstName: true,
      legalLastName: true,
    },
  });
  const buyerPhone = input.card.phone?.trim() || dbUser?.phone?.trim() || '';
  const buyerPhoneCc =
    input.card.phoneCountryCode?.trim() || dbUser?.phoneCountryCode?.trim() || '';
  if (!buyerPhone || !buyerPhoneCc) {
    throw new AppError(400, 'Phone number with country code is required', 'PHONE_REQUIRED');
  }
  /** 카드 buyer 성명은 프로필 법적 성명만 사용 — 클라이언트가 보낸 이름은 무시 (사기 방지) */
  const firstName = normalizeLegalNamePart(dbUser?.legalFirstName);
  const lastName = normalizeLegalNamePart(dbUser?.legalLastName);
  if (!firstName || !lastName) {
    throw new AppError(
      400,
      'Legal English first and last name are required on your TINPASS profile for card payment',
      'LEGAL_NAME_REQUIRED',
    );
  }
  if (!ENGLISH_LEGAL_NAME_RE.test(firstName) || !ENGLISH_LEGAL_NAME_RE.test(lastName)) {
    throw new AppError(
      400,
      'Legal first and last name must be in English letters',
      'CARD_BUYER_NAME_ENGLISH',
    );
  }

  const settlementAsset = await getSettlementAsset();
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: input.walletId,
      userId: merchantScopeUserId(user),
      isActive: true,
      approvalStatus: WalletApprovalStatus.APPROVED,
      deleteRequestedAt: null,
      assetType: settlementAsset,
    },
  });
  if (!wallet) {
    throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
  }
  const { assertNetworkForAsset } = await import('./wallet-policy.service');
  assertNetworkForAsset(wallet.network, settlementAsset);

  const sessionPolicy = await hqPolicyService.getSessionPolicy();
  const currency = input.fiatCurrency ?? sessionPolicy.defaultUsdtFiatCurrency ?? 'JPY';
  const createProfile = await prisma.customerProfile.findUnique({
    where: { id: user.customerProfileId },
    select: { customerType: true },
  });
  await hqPolicyService.assertUsdtFiatMethodEnabled(
    currency,
    'CARD',
    createProfile?.customerType,
  );
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
    const split = splitCardCharge(input.cardChargeFiat, feePercent);
    cardChargeFiat = input.cardChargeFiat;
    cardFeeFiat = split.cardFeeFiat;
    fiatAmount = split.fiatForConversion;
    await validateCardChargeAmount(
      currency,
      cardChargeFiat,
      createProfile?.customerType,
    );
    if (rate > 0) {
      await validateUsdtRiskLimitAmount({
        customerProfileId: user.customerProfileId,
        usdtAmount: fiatAmount / rate,
        fiatCurrency: currency,
        exchangeRate: rate,
        fiatAmount: cardChargeFiat,
        paymentMethod: 'CARD',
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
    const preview = await previewUsdtCardFees(user, {
      walletId: input.walletId,
      fiatCurrency: currency,
      targetUsdtAmount: input.targetUsdtAmount,
      cardBrand: input.cardBrand,
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
    await validateUsdtRiskLimitAmount({
      customerProfileId: user.customerProfileId,
      usdtAmount: Number(input.targetUsdtAmount),
      fiatCurrency: currency,
      exchangeRate: rate,
      fiatAmount: cardChargeFiat,
      paymentMethod: 'CARD',
    });
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
    fiatAmount: cardChargeFiat,
    paymentMethod: 'CARD',
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
            cardFeePercentSnapshot: feePercent,
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
        note: `USDT_CARD_PENDING|${currency}`,
      },
    });

    return created;
  });

  try {
    const checkout = await prepareIcopayCheckout(icopay, {
      orderNo: orderId,
      amount: cardChargeFiat,
      currency,
      productName: `TINPASS ${orderId}`,
      lang: input.lang,
      resultUrl: `${ICOPAY_BROWSER_RESULT_URL}?orderNo=${encodeURIComponent(orderId)}&ticketId=${encodeURIComponent(ticket.id)}`,
      buyer: {
        email: input.card.email || dbUser?.email || '',
        phone: buyerPhone,
        phoneCountryCode: buyerPhoneCc,
        cardholderName: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
      },
    });


    // ICOPAY merchant sandbox: prepare has no payUrl — complete simulates approval (no EP)
    if (checkout.sandbox || String(checkout.integrationMode || '').toUpperCase() === 'SANDBOX') {
      const done = await completeIcopaySandboxCheckout(icopay, {
        orderNo: checkout.orderNo || orderId,
        sessionToken: checkout.sessionToken,
      });
      const paid = isIcopayPaidStatus(done.status) || done.status === 'APPROVED';
      const updated = await applyCardPaymentOutcome({
        ticketId: ticket.id,
        orderNo: checkout.orderNo || orderId,
        paid,
        transactionId: checkout.sessionId || checkout.sessionToken || orderId,
        note: paid
          ? 'ICOPAY sandbox complete (no live acquirer)'
          : `ICOPAY sandbox result: ${done.status}`,
        actorUserId: user.id,
      });
      const serializedSb = serializeTicket(
        updated || ticket,
        (await getWorkflowDisplay()).sla,
      );
      return {
        ...serializedSb,
        icopayCheckout: {
          payUrl: '',
          sessionId: checkout.sessionId,
          sessionToken: checkout.sessionToken,
          embedScriptUrl: checkout.embedScriptUrl,
          expiresAt: checkout.expiresAt,
          integrationMode: 'SANDBOX',
          sandbox: true,
          orderNo: checkout.orderNo,
          payCurrency: currency,
          payAmount: cardChargeFiat,
        },
      };
    }

    await prisma.usdtPurchaseDetail.update({
      where: { ticketId: ticket.id },
      data: {
        icopayTransactionId: checkout.sessionId || checkout.sessionToken || null,
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
        sandbox: false,
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
  console.info('[icopay-webhook]', {
    orderNo: parsed.orderNo || '',
    paymentStatus: parsed.paymentStatus || '',
    amount: parsed.amount ?? null,
    currency: parsed.currency || '',
  });
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
    const expectedCcy = String(
      ticket.usdtPurchase.cardPayCurrency || ticket.usdtPurchase.fiatCurrency || '',
    ).toUpperCase();
    const webhookCcy = String(parsed.currency || '').toUpperCase();
    /** ICOPAY는 JPY 청구를 THB 등 정산 통화로 통지 — 통화가 다르면 금액 비교를 건너뛴다 */
    const sameCurrency = !webhookCcy || !expectedCcy || webhookCcy === expectedCcy;
    if (
      sameCurrency &&
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
        reason: `amount mismatch webhook=${parsed.amount} expected=${expectedPay} ${expectedCcy}`,
      };
    }
    await applyCardPaymentOutcome({
      ticketId: ticket.id,
      orderNo: parsed.orderNo,
      paid: true,
      transactionId: parsed.transactionId,
      last4: parsed.last4,
      note: `USDT_ICOPAY_WEBHOOK_PAID|${parsed.transactionId || status}`,
    });
    return { success: true, orderNo: parsed.orderNo, paymentStatus: 'APPROVED' };
  }
  if (isIcopayTerminalFailedStatus(status)) {
    const u = String(status).toUpperCase();
    const cancelled = u === 'CANCELLED' || u === 'CANCELED';
    await applyCardPaymentOutcome({
      ticketId: ticket.id,
      orderNo: parsed.orderNo,
      paid: false,
      note: cancelled
        ? `USDT_ICOPAY_WEBHOOK_CANCEL|${status}`
        : `USDT_ICOPAY_WEBHOOK_FAIL|${status}`,
    });
    return {
      success: true,
      orderNo: parsed.orderNo,
      paymentStatus: cancelled ? 'CANCELLED' : 'DECLINED',
    };
  }
  return { success: true, pending: true, orderNo: parsed.orderNo, paymentStatus: status };
}

/** Status API 폴링 — 브라우저 복귀 후 결제 확정 */
/**
 * ICOPAY 브라우저 복귀 — orderNo/ticketId로 티켓을 찾아 상태 동기화 후 상세로 안내.
 */
export async function resolveUsdtCardPaymentReturn(
  user: AuthUser,
  input: { orderNo?: string | null; ticketId?: string | null },
) {
  const orderNo = String(input.orderNo || '')
    .trim()
    .replace(/\D/g, '');
  const ticketIdHint = String(input.ticketId || '').trim();

  let ticket =
    ticketIdHint.length > 0
      ? await prisma.transactionTicket.findFirst({
          where: { id: ticketIdHint },
          include: USDT_PURCHASE_INCLUDE,
        })
      : null;

  if (!ticket?.usdtPurchase && orderNo) {
    ticket = await prisma.transactionTicket.findFirst({
      where: {
        OR: [{ ticketNo: orderNo }, { usdtPurchase: { icopayOrderId: orderNo } }],
      },
      include: USDT_PURCHASE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 쿼리에 번호가 없으면 최근 카드 결제 대기 건으로 복구 (가맹 Result URL이 목록만 가리킬 때) */
  if (!ticket?.usdtPurchase && isMerchantSide(user) && user.customerProfileId) {
    ticket = await prisma.transactionTicket.findFirst({
      where: {
        customerId: user.customerProfileId,
        usdtPurchase: {
          paymentMethod: UsdtPaymentMethod.CARD,
          status: UsdtPurchaseStatus.CARD_PAYMENT_PENDING,
        },
      },
      include: USDT_PURCHASE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!ticket?.usdtPurchase) {
    throw new AppError(404, 'Card payment ticket not found', 'NOT_FOUND');
  }
  if (isMerchantSide(user) && ticket.customerId !== user.customerProfileId) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }

  const synced = await syncUsdtCardPayment(user, ticket.id);
  const paid =
    synced.cardPaymentStatus === 'APPROVED' ||
    synced.status === 'ADMIN_REVIEWING' ||
    synced.status === 'COMPLETED' ||
    synced.status === 'TRANSFER_IN_PROGRESS' ||
    synced.status === 'DEPOSIT_PROOF_PENDING';
  const declined =
    synced.cardPaymentStatus === 'DECLINED' || synced.status === 'CANCELLED';

  return {
    ticketId: synced.id,
    ticketNo: synced.ticketNo,
    status: synced.status,
    cardPaymentStatus: synced.cardPaymentStatus ?? null,
    outcome: paid ? ('PAID' as const) : declined ? ('DECLINED' as const) : ('PENDING' as const),
    ticket: synced,
  };
}

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
      note: `USDT_ICOPAY_STATUS_PAID|${status.transactionId || status.paymentStatus}`,
      actorUserId: user.id,
    });
    if (updated) return serializeTicket(updated, (await getWorkflowDisplay()).sla);
  }
  if (isIcopayTerminalFailedStatus(status.paymentStatus)) {
    const u = String(status.paymentStatus).toUpperCase();
    const cancelled = u === 'CANCELLED' || u === 'CANCELED';
    const updated = await applyCardPaymentOutcome({
      ticketId: ticket.id,
      orderNo,
      paid: false,
      note: cancelled
        ? `USDT_ICOPAY_STATUS_CANCEL|${status.paymentStatus}`
        : `USDT_ICOPAY_STATUS_FAIL|${status.paymentStatus}`,
      actorUserId: user.id,
    });
    if (updated) return serializeTicket(updated, (await getWorkflowDisplay()).sla);
  }
  /** 오래된 NOT_FOUND·미응답 — 결제 창 이탈·만료로 거래 실패 처리 */
  const ageMs = Date.now() - new Date(ticket.createdAt).getTime();
  const abandonedMs = 30 * 60 * 1000;
  if (
    (status.paymentStatus === 'NOT_FOUND' || status.paymentStatus === 'UNKNOWN') &&
    ageMs >= abandonedMs
  ) {
    const updated = await applyCardPaymentOutcome({
      ticketId: ticket.id,
      orderNo,
      paid: false,
      note: `USDT_ICOPAY_STATUS_FAIL|${status.paymentStatus}`,
      actorUserId: user.id,
    });
    if (updated) return serializeTicket(updated, (await getWorkflowDisplay()).sla);
  }
  return serializeTicket(ticket, (await getWorkflowDisplay()).sla);
}

/**
 * 목록 조회 시 카드결제중 건을 ICOPAY status와 맞춰 승인/거래실패로 반영.
 * 최대 limit건만 처리해 목록 응답을 과도하게 지연시키지 않는다.
 */
export async function reconcilePendingCardPayments(
  user: AuthUser,
  ticketIds: string[],
  limit = 8,
) {
  const ids = ticketIds.filter(Boolean).slice(0, limit);
  for (const id of ids) {
    try {
      await syncUsdtCardPayment(user, id);
    } catch (e) {
      console.warn('[icopay-reconcile]', id, e instanceof Error ? e.message : e);
    }
  }
}

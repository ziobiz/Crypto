import {
  CustomerType,
  MemberGrade,
  MembershipOrderStatus,
  MembershipPayMeans,
} from '@prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type { AuthUser } from '../types/auth';
import {
  prepareIcopayCheckout,
  getIcopayCheckoutStatus,
  isIcopayPaidStatus,
  assertIcopayBuyerContact,
  type IcopayPrepareResult,
} from './icopay.service';
import {
  assertCardPaymentAvailable,
  assertIcopayConfigured,
  getIcopayConfig,
} from './card-payment-policy.service';
import type { PaidMemberGrade } from '../constants/hq-policy';
import {
  assertMembershipRepurchaseGrade,
  findCatalogItem,
  getPaidMembershipExpressQuotas,
  getPaidMembershipProducts,
  isPaidMemberGrade,
  listCatalogItems,
  quotasForGrade,
} from './paid-membership.service';
import {
  quoteMembershipPrice,
  resolveCryptoAssetFromCurrency,
} from './membership-price.service';

const MEMBERSHIP_RESULT_URL = 'https://tinpass.com/dashboard/membership/result';

function generateMembershipOrderNo(): string {
  const d = new Date();
  const ymd = [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('');
  const rand = String(Math.floor(Math.random() * 1e10)).padStart(10, '0');
  return `${ymd}${rand}`;
}

function typeKey(customerType: CustomerType): 'INDIVIDUAL' | 'CORPORATE' {
  return customerType === CustomerType.CORPORATE ? 'CORPORATE' : 'INDIVIDUAL';
}

export async function listSellableMembershipProducts(customerType: CustomerType) {
  const policy = await getPaidMembershipProducts();
  const items = listCatalogItems(policy, customerType).filter(
    (it) => it.enabled && it.price > 0,
  );
  let cryptoCheckoutReady = false;
  try {
    await assertIcopayConfigured();
    cryptoCheckoutReady = true;
  } catch {
    cryptoCheckoutReady = false;
  }
  return Promise.all(
    items.map(async (p) => {
      const quote = await quoteMembershipPrice(p.price, p.currency);
      return {
        id: p.id,
        name: p.name,
        grade: p.grade,
        customerType: p.customerType,
        enabled: p.enabled,
        price: p.price,
        currency: p.currency,
        periodDays: p.periodDays,
        payMeans: p.payMeans,
        priceUsd: quote.priceUsd,
        chargeAmount: quote.chargeAmount,
        equivalents: quote.equivalents,
        usdToEurcRate: quote.usdToEurcRate,
        cryptoCheckoutReady,
      };
    }),
  );
}

export async function createMembershipPurchase(input: {
  user: AuthUser;
  productId?: string;
  /** @deprecated use productId — 레거시 호환 */
  grade?: string;
  payMeans: 'CARD' | 'CRYPTO';
  lang?: string;
}): Promise<{
  order: {
    id: string;
    orderNo: string;
    grade: MemberGrade;
    amount: number;
    currency: string;
    periodDays: number;
    payMeans: MembershipPayMeans;
    status: MembershipOrderStatus;
  };
  icopayCheckout: IcopayPrepareResult | null;
  cryptoPending: boolean;
}> {
  const profileId = input.user.customerProfileId;
  if (!profileId) {
    throw new AppError(400, 'Customer profile required', 'NO_CUSTOMER_PROFILE');
  }
  const profile = await prisma.customerProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      customerType: true,
      memberGrade: true,
      paidMemberUntil: true,
    },
  });
  if (!profile) {
    throw new AppError(404, 'Customer profile not found', 'PROFILE_NOT_FOUND');
  }

  const policy = await getPaidMembershipProducts();
  let product = input.productId ? findCatalogItem(policy, input.productId) : null;
  if (!product && input.grade && isPaidMemberGrade(input.grade)) {
    product =
      listCatalogItems(policy, profile.customerType).find(
        (it) => it.grade === input.grade && it.enabled && it.price > 0,
      ) ?? null;
  }
  if (!product || product.customerType !== typeKey(profile.customerType)) {
    throw new AppError(400, 'This membership is not for sale', 'PRODUCT_DISABLED');
  }
  if (!product.enabled || product.price <= 0) {
    throw new AppError(400, 'This membership is not for sale', 'PRODUCT_DISABLED');
  }
  const grade = product.grade;
  assertMembershipRepurchaseGrade({
    currentGrade: profile.memberGrade,
    paidMemberUntil: profile.paidMemberUntil,
    nextGrade: grade,
  });

  const payMeans = input.payMeans === 'CRYPTO' ? 'CRYPTO' : 'CARD';
  const quote = await quoteMembershipPrice(product.price, product.currency);
  const chargeAmount = quote.chargeAmount;
  const chargeCurrency = product.currency;

  if (payMeans === 'CRYPTO' && product.payMeans === 'CARD') {
    throw new AppError(400, 'This product is card-only', 'PAY_MEANS_CARD_ONLY');
  }
  if (payMeans === 'CARD' && product.payMeans === 'CRYPTO') {
    throw new AppError(400, 'This product is crypto-only', 'PAY_MEANS_CRYPTO_ONLY');
  }

  if (payMeans === 'CARD') {
    await assertCardPaymentAvailable();
  } else {
    await assertIcopayConfigured();
  }

  const user = await prisma.user.findUnique({
    where: { id: input.user.id },
    select: {
      email: true,
      name: true,
      legalFirstName: true,
      legalLastName: true,
      phone: true,
      phoneCountryCode: true,
    },
  });
  const buyerContact = assertIcopayBuyerContact({
    email: user?.email,
    phone: user?.phone,
    phoneCountryCode: user?.phoneCountryCode,
  });
  const cardholderName =
    [user?.legalFirstName, user?.legalLastName].filter(Boolean).join(' ').trim() ||
    user?.name ||
    'TINPASS Member';

  const orderNo = generateMembershipOrderNo();
  const resultUrl = `${MEMBERSHIP_RESULT_URL}?orderNo=${encodeURIComponent(orderNo)}`;
  const cryptoAsset =
    payMeans === 'CRYPTO'
      ? resolveCryptoAssetFromCurrency(chargeCurrency) || 'USDT'
      : null;
  /** ICOPAY 본사 수탁(USDT/USDC×BEP20)과 맞춤 — BASE만 허용 CSV 앞에 있으면 CUSTODY_MISSING */
  const cryptoNetwork = payMeans === 'CRYPTO' ? 'BEP20' : null;

  const order = await prisma.membershipOrder.create({
    data: {
      orderNo,
      customerProfileId: profile.id,
      customerType: profile.customerType,
      grade: grade as MemberGrade,
      periodDays: product.periodDays,
      amount: chargeAmount,
      currency: chargeCurrency,
      payMeans:
        payMeans === 'CRYPTO' ? MembershipPayMeans.CRYPTO : MembershipPayMeans.CARD,
      cryptoAsset,
      cryptoNetwork,
      status: MembershipOrderStatus.PENDING,
      icopayOrderId: orderNo,
      meta: {
        productId: product.id,
        productName: product.name,
        priceUsd: quote.priceUsd,
        equivalents: quote.equivalents,
      },
    },
  });

  const icopay = await getIcopayConfig();
  let checkout: IcopayPrepareResult;
  try {
    checkout = await prepareIcopayCheckout(icopay, {
      orderNo,
      amount: chargeAmount,
      currency: chargeCurrency,
      productName: `TINPASS Membership ${grade} ${product.periodDays}d`,
      lang: input.lang,
      resultUrl,
      payMeans: payMeans === 'CRYPTO' ? 'CRYPTO' : undefined,
      assetCode: cryptoAsset || undefined,
      networkCode: cryptoNetwork || undefined,
      buyer: {
        email: buyerContact.email,
        phone: buyerContact.phone,
        phoneCountryCode: buyerContact.phoneCountryCode,
        cardholderName,
      },
    });
  } catch (e) {
    await prisma.membershipOrder.update({
      where: { id: order.id },
      data: {
        status: MembershipOrderStatus.FAILED,
        failReason: e instanceof AppError ? e.message : 'ICOPAY prepare failed',
      },
    });
    throw e;
  }

  await prisma.membershipOrder.update({
    where: { id: order.id },
    data: {
      icopaySessionId: checkout.sessionId || null,
      icopayPayUrl: checkout.payUrl || null,
    },
  });

  return {
    order: {
      id: order.id,
      orderNo: order.orderNo,
      grade: order.grade,
      amount: order.amount,
      currency: order.currency,
      periodDays: order.periodDays,
      payMeans: order.payMeans,
      status: order.status,
    },
    icopayCheckout: checkout,
    cryptoPending: false,
  };
}

/**
 * 결제 성공 시 등급·유료 기간·EXPRESS 쿼터 리셋.
 * 구매 시점부터 periodDays (잔여 기간 가산 없음). 쿼터도 해당 등급 총량으로 재부여.
 */
export async function activatePaidMembershipFromOrder(orderId: string) {
  const order = await prisma.membershipOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new AppError(404, 'Membership order not found', 'ORDER_NOT_FOUND');
  }
  if (order.status === MembershipOrderStatus.PAID) {
    return order;
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { id: order.customerProfileId },
    select: { customerType: true, memberGrade: true, paidMemberUntil: true },
  });
  if (profile) {
    assertMembershipRepurchaseGrade({
      currentGrade: profile.memberGrade,
      paidMemberUntil: profile.paidMemberUntil,
      nextGrade: order.grade,
    });
  }

  const now = Date.now();
  const until = new Date(now + order.periodDays * 24 * 60 * 60 * 1000);
  const quotaPolicy = await getPaidMembershipExpressQuotas();
  const quotas = quotasForGrade(
    quotaPolicy,
    profile?.customerType ?? order.customerType,
    order.grade,
  );

  await prisma.$transaction([
    prisma.membershipOrder.update({
      where: { id: order.id },
      data: {
        status: MembershipOrderStatus.PAID,
        paidAt: new Date(),
      },
    }),
    prisma.customerProfile.update({
      where: { id: order.customerProfileId },
      data: {
        memberGrade: order.grade,
        paidMemberUntil: until,
        paidMemberSource:
          order.payMeans === MembershipPayMeans.CRYPTO ? 'SHOP_CRYPTO' : 'SHOP_CARD',
        expressQuotaGranted: quotas as object,
        expressQuotaRemaining: quotas as object,
      },
    }),
  ]);

  return prisma.membershipOrder.findUniqueOrThrow({ where: { id: order.id } });
}

export async function applyMembershipOrderPaymentOutcome(input: {
  orderNo: string;
  paid: boolean;
  reason?: string;
  transactionId?: string;
  assetCode?: string;
  networkCode?: string;
  depositTxHash?: string;
  amount?: number;
  currency?: string;
  pgKind?: string;
  payMeans?: string;
  webhookExtra?: Record<string, unknown>;
}) {
  const order = await prisma.membershipOrder.findFirst({
    where: {
      OR: [{ orderNo: input.orderNo }, { icopayOrderId: input.orderNo }],
    },
  });
  if (!order) return { found: false as const };
  if (order.status === MembershipOrderStatus.PAID) {
    return { found: true as const, order, alreadyPaid: true };
  }

  const prevMeta =
    order.meta && typeof order.meta === 'object' && !Array.isArray(order.meta)
      ? (order.meta as Record<string, unknown>)
      : {};
  const cryptoMeta = {
    ...prevMeta,
    icopayTransactionId: input.transactionId || prevMeta.icopayTransactionId || null,
    depositTxHash: input.depositTxHash || prevMeta.depositTxHash || null,
    webhookPgKind: input.pgKind || prevMeta.webhookPgKind || null,
    webhookPayMeans: input.payMeans || prevMeta.webhookPayMeans || null,
    webhookAmount: input.amount ?? prevMeta.webhookAmount ?? null,
    webhookCurrency: input.currency || prevMeta.webhookCurrency || null,
    ...(input.webhookExtra
      ? { webhookExtra: input.webhookExtra as Record<string, string | number | boolean | null> }
      : {}),
  } as object;

  if (!input.paid) {
    const updated = await prisma.membershipOrder.update({
      where: { id: order.id },
      data: {
        status: MembershipOrderStatus.FAILED,
        failReason: input.reason || 'PAYMENT_FAILED',
        cryptoAsset: input.assetCode || order.cryptoAsset,
        cryptoNetwork: input.networkCode || order.cryptoNetwork,
        meta: cryptoMeta,
      },
    });
    return { found: true as const, order: updated, alreadyPaid: false };
  }

  await prisma.membershipOrder.update({
    where: { id: order.id },
    data: {
      cryptoAsset: input.assetCode || order.cryptoAsset,
      cryptoNetwork: input.networkCode || order.cryptoNetwork,
      meta: cryptoMeta,
    },
  });
  const activated = await activatePaidMembershipFromOrder(order.id);
  return { found: true as const, order: activated, alreadyPaid: false };
}

export async function syncMembershipOrderPayment(orderNo: string) {
  const order = await prisma.membershipOrder.findFirst({
    where: {
      OR: [{ orderNo }, { icopayOrderId: orderNo }],
    },
  });
  if (!order) {
    throw new AppError(404, 'Membership order not found', 'ORDER_NOT_FOUND');
  }
  if (order.status === MembershipOrderStatus.PAID) {
    return { order, synced: false, paid: true };
  }

  const icopay = await getIcopayConfig();
  const status = await getIcopayCheckoutStatus(
    icopay,
    order.icopayOrderId || order.orderNo,
    order.icopaySessionId || undefined,
  );
  if (status.found && isIcopayPaidStatus(status.paymentStatus)) {
    const activated = await applyMembershipOrderPaymentOutcome({
      orderNo: order.orderNo,
      paid: true,
      transactionId: status.transactionId,
      assetCode: status.assetCode,
      networkCode: status.networkCode,
      depositTxHash: status.depositTxHash,
      amount: status.amount,
      currency: status.currency,
      pgKind: status.pgKind,
      payMeans: status.payMeans,
    });
    return {
      order: activated.found ? activated.order : order,
      synced: true,
      paid: activated.found && activated.order.status === MembershipOrderStatus.PAID,
    };
  }
  return { order, synced: true, paid: false, paymentStatus: status.paymentStatus };
}

export async function getMembershipOrderForUser(orderNo: string, customerProfileId: string) {
  return prisma.membershipOrder.findFirst({
    where: {
      customerProfileId,
      OR: [{ orderNo }, { icopayOrderId: orderNo }],
    },
  });
}

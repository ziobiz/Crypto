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
  getIcopayConfig,
} from './card-payment-policy.service';
import type { PaidMemberGrade } from '../constants/hq-policy';
import {
  findCatalogItem,
  getPaidMembershipProducts,
  isPaidMemberGrade,
  listCatalogItems,
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
        cryptoCheckoutReady: false,
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

  const payMeans = input.payMeans === 'CRYPTO' ? 'CRYPTO' : 'CARD';
  const quote = await quoteMembershipPrice(product.price, product.currency);
  const chargeAmount = quote.chargeAmount;
  const chargeCurrency = product.currency;

  if (payMeans === 'CRYPTO') {
    if (product.payMeans === 'CARD') {
      throw new AppError(400, 'This product is card-only', 'PAY_MEANS_CARD_ONLY');
    }
    /** 1차: ICOPAY 크립토 가맹 연동 전 — 주문만 만들고 결제창 미오픈 */
    const orderNo = generateMembershipOrderNo();
    const cryptoAsset = resolveCryptoAssetFromCurrency(chargeCurrency);
    const order = await prisma.membershipOrder.create({
      data: {
        orderNo,
        customerProfileId: profile.id,
        customerType: profile.customerType,
        grade: grade as MemberGrade,
        periodDays: product.periodDays,
        amount: chargeAmount,
        currency: chargeCurrency,
        payMeans: MembershipPayMeans.CRYPTO,
        cryptoAsset,
        status: MembershipOrderStatus.PENDING,
        failReason: 'CRYPTO_CHECKOUT_NOT_READY',
        meta: {
          note: 'Awaiting HQ ops crypto membership integration',
          productId: product.id,
          productName: product.name,
          priceUsd: quote.priceUsd,
          equivalents: quote.equivalents,
        },
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
      icopayCheckout: null,
      cryptoPending: true,
    };
  }

  if (product.payMeans === 'CRYPTO') {
    throw new AppError(400, 'This product is crypto-only', 'PAY_MEANS_CRYPTO_ONLY');
  }

  await assertCardPaymentAvailable();

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

  const order = await prisma.membershipOrder.create({
    data: {
      orderNo,
      customerProfileId: profile.id,
      customerType: profile.customerType,
      grade: grade as MemberGrade,
      periodDays: product.periodDays,
      amount: chargeAmount,
      currency: chargeCurrency,
      payMeans: MembershipPayMeans.CARD,
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

/** 결제 성공 시 등급·유료 만료 연장 (잔여 기간 있으면 가산) */
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
    select: { paidMemberUntil: true },
  });
  const now = Date.now();
  const base =
    profile?.paidMemberUntil && profile.paidMemberUntil.getTime() > now
      ? profile.paidMemberUntil.getTime()
      : now;
  const until = new Date(base + order.periodDays * 24 * 60 * 60 * 1000);

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
      },
    }),
  ]);

  return prisma.membershipOrder.findUniqueOrThrow({ where: { id: order.id } });
}

export async function applyMembershipOrderPaymentOutcome(input: {
  orderNo: string;
  paid: boolean;
  reason?: string;
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
  if (!input.paid) {
    const updated = await prisma.membershipOrder.update({
      where: { id: order.id },
      data: {
        status: MembershipOrderStatus.FAILED,
        failReason: input.reason || 'PAYMENT_FAILED',
      },
    });
    return { found: true as const, order: updated, alreadyPaid: false };
  }
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
  if (order.payMeans === MembershipPayMeans.CRYPTO) {
    throw new AppError(
      503,
      'Crypto membership checkout is not ready (HQ ops integration)',
      'CRYPTO_CHECKOUT_NOT_READY',
    );
  }

  const icopay = await getIcopayConfig();
  const status = await getIcopayCheckoutStatus(
    icopay,
    order.icopayOrderId || order.orderNo,
    order.icopaySessionId || undefined,
  );
  if (status.found && isIcopayPaidStatus(status.paymentStatus)) {
    const activated = await activatePaidMembershipFromOrder(order.id);
    return { order: activated, synced: true, paid: true };
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

import {
  MembershipOrderStatus,
  MembershipPayMeans,
  MemberGrade,
  Prisma,
} from '@prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  HQ_CONFIG_KEYS,
  normalizePaidMembershipRefundPolicy,
  defaultPaidMembershipRefundPolicy,
  type PaidMembershipRefundPolicy,
} from '../constants/hq-policy';
import { formatMemberGradeDisplayCode } from './paid-membership.service';

export async function getPaidMembershipRefundPolicy(): Promise<PaidMembershipRefundPolicy> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.paidMembershipRefundPolicy },
  });
  return normalizePaidMembershipRefundPolicy(row?.value);
}

export async function savePaidMembershipRefundPolicy(
  policy: PaidMembershipRefundPolicy,
): Promise<PaidMembershipRefundPolicy> {
  const normalized = normalizePaidMembershipRefundPolicy(policy);
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.paidMembershipRefundPolicy },
    create: {
      key: HQ_CONFIG_KEYS.paidMembershipRefundPolicy,
      value: normalized as unknown as Prisma.InputJsonValue,
    },
    update: { value: normalized as unknown as Prisma.InputJsonValue },
  });
  return normalized;
}

export type MembershipOrderListQuery = {
  page?: number;
  limit?: number;
  dateField?: 'createdAt' | 'paidAt';
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  payMeans?: string;
  cryptoAsset?: string;
  searchField?: string;
  keyword?: string;
  sortDir?: 'asc' | 'desc';
};

function dayStart(isoDate: string): Date {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  return d;
}

function dayEnd(isoDate: string): Date {
  const d = new Date(`${isoDate}T23:59:59.999Z`);
  return d;
}

export async function listMembershipOrdersAdmin(query: MembershipOrderListQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const dateField = query.dateField === 'paidAt' ? 'paidAt' : 'createdAt';

  const where: Prisma.MembershipOrderWhereInput = {};

  if (query.status) {
    where.status = query.status as MembershipOrderStatus;
  }
  if (query.payMeans === 'CARD' || query.payMeans === 'CRYPTO') {
    where.payMeans = query.payMeans as MembershipPayMeans;
  }
  if (query.cryptoAsset) {
    where.cryptoAsset = query.cryptoAsset.toUpperCase();
  }

  const and: Prisma.MembershipOrderWhereInput[] = [];

  if (query.dateFrom || query.dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (query.dateFrom) range.gte = dayStart(query.dateFrom);
    if (query.dateTo) range.lte = dayEnd(query.dateTo);
    if (dateField === 'paidAt') {
      /** 결제·취소·환불 시각이 기간에 포함되면 목록에 표시 */
      and.push({
        OR: [{ paidAt: range }, { cancelledAt: range }, { refundedAt: range }],
      });
    } else {
      and.push({ createdAt: range });
    }
  }

  const kw = (query.keyword || '').trim();
  if (kw) {
    const field = query.searchField || 'all';
    const or: Prisma.MembershipOrderWhereInput[] = [];
    if (field === 'all' || field === 'orderNo') {
      or.push({ orderNo: { contains: kw, mode: 'insensitive' } });
      or.push({ icopayOrderId: { contains: kw, mode: 'insensitive' } });
    }
    if (field === 'all' || field === 'customer') {
      or.push({
        customerProfile: {
          user: {
            OR: [
              { email: { contains: kw, mode: 'insensitive' } },
              { name: { contains: kw, mode: 'insensitive' } },
            ],
          },
        },
      });
    }
    if (or.length) and.push({ OR: or });
  }

  if (and.length) where.AND = and;

  const [total, rows] = await Promise.all([
    prisma.membershipOrder.count({ where }),
    prisma.membershipOrder.findMany({
      where,
      orderBy: { [dateField]: sortDir },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customerProfile: {
          select: {
            id: true,
            customerType: true,
            memberGrade: true,
            paidMemberUntil: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
    }),
  ]);

  const refundPolicy = await getPaidMembershipRefundPolicy();

  return {
    total,
    page,
    limit,
    refundPolicy,
    items: rows.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      customerType: o.customerType,
      grade: o.grade,
      displayCode: formatMemberGradeDisplayCode(o.grade, o.customerType),
      periodDays: o.periodDays,
      amount: o.amount,
      currency: o.currency,
      payMeans: o.payMeans,
      status: o.status,
      cryptoAsset: o.cryptoAsset,
      cryptoNetwork: o.cryptoNetwork,
      icopayOrderId: o.icopayOrderId,
      paidAt: o.paidAt,
      cancelledAt: o.cancelledAt,
      refundedAt: o.refundedAt,
      failReason: o.failReason,
      adminNote: o.adminNote,
      createdAt: o.createdAt,
      customer: o.customerProfile.user
        ? {
            id: o.customerProfile.user.id,
            email: o.customerProfile.user.email,
            name: o.customerProfile.user.name,
          }
        : null,
      paidMemberUntil: o.customerProfile.paidMemberUntil,
      currentGrade: o.customerProfile.memberGrade,
    })),
  };
}

export async function getMembershipOrderAdmin(orderNo: string) {
  const order = await prisma.membershipOrder.findFirst({
    where: {
      OR: [{ orderNo }, { icopayOrderId: orderNo }, { id: orderNo }],
    },
    include: {
      customerProfile: {
        select: {
          id: true,
          customerType: true,
          memberGrade: true,
          paidMemberUntil: true,
          paidMemberSource: true,
          user: { select: { id: true, email: true, name: true, phone: true } },
        },
      },
    },
  });
  if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
  const refundPolicy = await getPaidMembershipRefundPolicy();
  return {
    refundPolicy,
    order: {
      ...order,
      displayCode: formatMemberGradeDisplayCode(order.grade, order.customerType),
    },
  };
}

/** PENDING 주문 관리자 취소 (혜택 없음) */
export async function adminCancelMembershipOrder(input: {
  orderNo: string;
  note?: string;
}) {
  const policy = await getPaidMembershipRefundPolicy();
  if (!policy.adminCancelRefundEnabled) {
    throw new AppError(403, 'Admin cancel/refund is disabled', 'REFUND_DISABLED');
  }
  const order = await prisma.membershipOrder.findFirst({
    where: { OR: [{ orderNo: input.orderNo }, { id: input.orderNo }] },
  });
  if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
  if (order.status !== MembershipOrderStatus.PENDING) {
    throw new AppError(400, 'Only PENDING orders can be cancelled', 'INVALID_STATUS');
  }
  return prisma.membershipOrder.update({
    where: { id: order.id },
    data: {
      status: MembershipOrderStatus.CANCELLED,
      cancelledAt: new Date(),
      adminNote: input.note?.trim() || null,
      failReason: 'ADMIN_CANCEL',
    },
  });
}

/**
 * PAID 주문 관리자 환불(내부 상태 + 유료혜택 회수).
 * ICOPAY 실환불 API는 추후 — 1차는 TINPASS 상태/혜택만.
 */
export async function adminRefundMembershipOrder(input: {
  orderNo: string;
  note?: string;
  revokeBenefits?: boolean;
}) {
  const policy = await getPaidMembershipRefundPolicy();
  if (!policy.adminCancelRefundEnabled) {
    throw new AppError(403, 'Admin cancel/refund is disabled', 'REFUND_DISABLED');
  }
  const order = await prisma.membershipOrder.findFirst({
    where: { OR: [{ orderNo: input.orderNo }, { id: input.orderNo }] },
  });
  if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
  if (order.status !== MembershipOrderStatus.PAID) {
    throw new AppError(400, 'Only PAID orders can be refunded', 'INVALID_STATUS');
  }

  const revoke = input.revokeBenefits !== false;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.membershipOrder.update({
      where: { id: order.id },
      data: {
        status: MembershipOrderStatus.REFUNDED,
        refundedAt: now,
        cancelledAt: now,
        adminNote: input.note?.trim() || null,
        failReason: 'ADMIN_REFUND',
      },
    });
    if (revoke) {
      await tx.customerProfile.update({
        where: { id: order.customerProfileId },
        data: {
          memberGrade: MemberGrade.STANDARD,
          paidMemberUntil: now,
          paidMemberSource: 'ADMIN_REFUND',
        },
      });
    }
  });

  return getMembershipOrderAdmin(order.orderNo);
}

export { defaultPaidMembershipRefundPolicy };

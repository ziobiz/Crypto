import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  createMembershipPurchase,
  getMembershipOrderForUser,
  listSellableMembershipProducts,
  syncMembershipOrderPayment,
} from '../services/membership-purchase.service';
import {
  formatMemberGradeDisplayCode,
  parseQuotaJson,
  resolvePaidMembershipStatus,
} from '../services/paid-membership.service';

const router = Router();
const CUSTOMER_ROLES = [UserRole.CUSTOMER, UserRole.CUSTOMER_OPERATOR] as const;

router.use(authenticate);

router.get(
  '/products',
  requireRoles(...CUSTOMER_ROLES),
  asyncHandler(async (req, res) => {
    const profileId = req.user!.customerProfileId;
    if (!profileId) throw new AppError(400, 'Customer profile required', 'NO_CUSTOMER_PROFILE');
    const profile = await prisma.customerProfile.findUnique({
      where: { id: profileId },
      select: {
        customerType: true,
        memberGrade: true,
        paidMemberUntil: true,
        paidMemberSource: true,
        expressQuotaGranted: true,
        expressQuotaRemaining: true,
      },
    });
    if (!profile) throw new AppError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
    const products = await listSellableMembershipProducts(profile.customerType);
    const status = resolvePaidMembershipStatus(profile);
    res.json({
      customerType: profile.customerType,
      status: {
        ...status,
        expressQuotaGranted: parseQuotaJson(profile.expressQuotaGranted),
        expressQuotaRemaining: parseQuotaJson(profile.expressQuotaRemaining),
      },
      products: products.map((p) => ({
        ...p,
        /** 상점 메뉴: 등급 코드 대문자 (PREMIUM / PREMIUMB) */
        displayCode: formatMemberGradeDisplayCode(p.grade, profile.customerType),
        menuName: formatMemberGradeDisplayCode(p.grade, profile.customerType),
      })),
      refundPolicy: 'NO_REFUND',
    });
  }),
);

router.get(
  '/me',
  requireRoles(...CUSTOMER_ROLES),
  asyncHandler(async (req, res) => {
    const profileId = req.user!.customerProfileId;
    if (!profileId) throw new AppError(400, 'Customer profile required', 'NO_CUSTOMER_PROFILE');
    const profile = await prisma.customerProfile.findUnique({
      where: { id: profileId },
      select: {
        customerType: true,
        memberGrade: true,
        paidMemberUntil: true,
        paidMemberSource: true,
        expressQuotaGranted: true,
        expressQuotaRemaining: true,
      },
    });
    if (!profile) throw new AppError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
    res.json({
      ...resolvePaidMembershipStatus(profile),
      expressQuotaGranted: parseQuotaJson(profile.expressQuotaGranted),
      expressQuotaRemaining: parseQuotaJson(profile.expressQuotaRemaining),
    });
  }),
);

const purchaseSchema = z
  .object({
    productId: z.string().min(1).optional(),
    grade: z.enum(['PREMIUM', 'VIP', 'VVIP', 'PRESTIGE', 'BLACK']).optional(),
    payMeans: z.enum(['CARD', 'CRYPTO']).default('CARD'),
    lang: z.string().optional(),
  })
  .refine((b) => Boolean(b.productId || b.grade), {
    message: 'productId or grade required',
  });

router.post(
  '/purchase',
  requireRoles(...CUSTOMER_ROLES),
  asyncHandler(async (req, res) => {
    const body = purchaseSchema.parse(req.body);
    const result = await createMembershipPurchase({
      user: req.user!,
      productId: body.productId,
      grade: body.grade,
      payMeans: body.payMeans,
      lang: body.lang || (req.headers['accept-language'] as string | undefined),
    });
    res.status(201).json(result);
  }),
);

router.get(
  '/orders/:orderNo',
  requireRoles(...CUSTOMER_ROLES),
  asyncHandler(async (req, res) => {
    const profileId = req.user!.customerProfileId;
    if (!profileId) throw new AppError(400, 'Customer profile required', 'NO_CUSTOMER_PROFILE');
    const order = await getMembershipOrderForUser(req.params.orderNo, profileId);
    if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
    res.json({ order });
  }),
);

router.post(
  '/orders/:orderNo/sync',
  requireRoles(...CUSTOMER_ROLES),
  asyncHandler(async (req, res) => {
    const profileId = req.user!.customerProfileId;
    if (!profileId) throw new AppError(400, 'Customer profile required', 'NO_CUSTOMER_PROFILE');
    const order = await getMembershipOrderForUser(req.params.orderNo, profileId);
    if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND');
    const result = await syncMembershipOrderPayment(order.orderNo);
    res.json(result);
  }),
);

export default router;

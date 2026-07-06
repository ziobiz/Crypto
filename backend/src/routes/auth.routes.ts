import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  CustomerType,
  UserRole,
  TradeEscrowStatus,
  UsdtPurchaseStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: { select: { id: true, name: true, type: true, path: true } },
        customerProfile: { select: { id: true, customerType: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
        customerProfile: user.customerProfile,
      },
    });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        organization: { select: { id: true, name: true, type: true, path: true } },
        customerProfile: {
          include: {
            recruitingOrg: { select: { id: true, name: true, code: true } },
          },
        },
        wallets: { where: { isActive: true }, orderBy: { isDefault: 'desc' } },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization,
      customerProfile: user.customerProfile,
      wallets: user.wallets.map((w) => ({
        ...w,
        gasFeeAmount: Number(w.gasFeeAmount),
        platformFeeAmount: Number(w.platformFeeAmount),
      })),
    });
  }),
);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
  customerType: z.nativeEnum(CustomerType),
  recruitingOrgId: z.string().min(1),
  businessName: z.string().optional(),
  businessNumber: z.string().optional(),
  representative: z.string().optional(),
  businessAddress: z.string().optional(),
  businessCategory: z.string().optional(),
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, 'Email already registered', 'CONFLICT');
    }

    const org = await prisma.organization.findFirst({
      where: { id: data.recruitingOrgId, isActive: true },
    });
    if (!org) {
      throw new AppError(404, 'Recruiting organization not found', 'NOT_FOUND');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: UserRole.CUSTOMER,
        customerProfile: {
          create: {
            customerType: data.customerType,
            recruitingOrgId: data.recruitingOrgId,
            businessName: data.businessName,
            businessNumber: data.businessNumber,
            representative: data.representative,
            businessAddress: data.businessAddress,
            businessCategory: data.businessCategory,
          },
        },
      },
      include: { customerProfile: true },
    });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerProfile: user.customerProfile,
      },
    });
  }),
);

router.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = req.user!;

    if (user.role === UserRole.SUPER_ADMIN) {
      const [usdtPending, escrowPending, usdtCompleted, escrowCompleted, totalLedger] =
        await Promise.all([
          prisma.usdtPurchaseDetail.count({
            where: {
              status: {
                in: [
                  UsdtPurchaseStatus.ADMIN_REVIEWING,
                  UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
                ],
              },
            },
          }),
          prisma.tradeEscrowDetail.count({
            where: {
              status: {
                in: [
                  TradeEscrowStatus.BUYER_DEPOSIT_PROOF,
                  TradeEscrowStatus.ADMIN_DEPOSIT_CONFIRMED,
                  TradeEscrowStatus.SELLER_FULFILLMENT_PROOF,
                  TradeEscrowStatus.BUYER_FINAL_APPROVAL,
                ],
              },
            },
          }),
          prisma.usdtPurchaseDetail.count({
            where: { status: UsdtPurchaseStatus.COMPLETED },
          }),
          prisma.tradeEscrowDetail.count({
            where: { status: TradeEscrowStatus.ESCROW_COMPLETED },
          }),
          prisma.ledgerEntry.aggregate({ _sum: { amount: true } }),
        ]);

      res.json({
        role: user.role,
        stats: {
          usdtPendingReview: usdtPending,
          escrowPending,
          usdtCompleted,
          escrowCompleted,
          totalCommissionPaid: Number(totalLedger._sum.amount ?? 0),
        },
      });
      return;
    }

    if (user.role === UserRole.ORG_STAFF && user.organizationId) {
      const { getOrgLedgerSummary } = await import('../services/commission.service');
      const ledger = await getOrgLedgerSummary(user.organizationId);
      const ticketFilter = {
        customer: {
          recruitingOrg: { path: { startsWith: user.organizationPath! } },
        },
      };

      const [usdtCount, escrowCount] = await Promise.all([
        prisma.transactionTicket.count({
          where: { ...ticketFilter, type: 'USDT_PURCHASE' },
        }),
        prisma.transactionTicket.count({
          where: { ...ticketFilter, type: 'TRADE_ESCROW' },
        }),
      ]);

      res.json({
        role: user.role,
        organizationId: user.organizationId,
        stats: {
          usdtTickets: usdtCount,
          escrowTickets: escrowCount,
          totalCommission: ledger.totalAmount,
          commissionCount: ledger.count,
        },
      });
      return;
    }

    if (user.role === UserRole.CUSTOMER && user.customerProfileId) {
      const [usdtTickets, escrowTickets, wallets] = await Promise.all([
        prisma.transactionTicket.count({
          where: { customerId: user.customerProfileId, type: 'USDT_PURCHASE' },
        }),
        prisma.transactionTicket.count({
          where: {
            OR: [
              { customerId: user.customerProfileId, type: 'TRADE_ESCROW' },
              { tradeEscrow: { buyerId: user.id } },
              { tradeEscrow: { sellerId: user.id } },
            ],
          },
        }),
        prisma.wallet.count({ where: { userId: user.id, isActive: true } }),
      ]);

      res.json({ role: user.role, stats: { usdtTickets, escrowTickets, wallets } });
      return;
    }

    res.json({ role: user.role, stats: {} });
  }),
);

export default router;

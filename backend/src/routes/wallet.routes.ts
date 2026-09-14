import { Router } from 'express';
import { z } from 'zod';
import { Prisma, UserRole, WalletApprovalStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { requireSensitiveOtp } from '../middleware/sensitiveOtp';
import { isMerchantAdmin, merchantScopeUserId } from '../lib/merchant-role';
import { recordMerchantOperation } from '../services/merchant-operation-log.service';
import { getGasNetworkPolicy, getHqTransactionFees, resolveTransactionFees, withNetworkGasFee } from '../services/transaction-fee.service';

const router = Router();

const feeFields = {
  fxFeePercent: z.number().min(0).max(100).default(0),
  gasFeeAmount: z.number().min(0).default(0),
  transferFeeAmount: z.number().min(0).default(0),
  otherFeeAmount: z.number().min(0).default(0),
  platformFeeAmount: z.number().min(0).default(0),
};

const createWalletSchema = z.object({
  label: z.string().optional(),
  address: z.string().min(10),
  network: z.string().default('TRC20'),
  isDefault: z.boolean().optional(),
  ...feeFields,
});

const updateWalletSchema = z.object({
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
  fxFeePercent: z.number().min(0).max(100).optional(),
  gasFeeAmount: z.number().min(0).optional(),
  transferFeeAmount: z.number().min(0).optional(),
  otherFeeAmount: z.number().min(0).optional(),
  platformFeeAmount: z.number().min(0).optional(),
});

function serializeWallet(w: {
  id: string;
  userId: string;
  label: string | null;
  address: string;
  network: string;
  isDefault: boolean;
  isActive: boolean;
  hqRegistered?: boolean;
  approvalStatus?: WalletApprovalStatus;
  fxFeePercent: unknown;
  gasFeeAmount: unknown;
  transferFeeAmount: unknown;
  otherFeeAmount: unknown;
  platformFeeAmount: unknown;
  feeCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...w,
    fxFeePercent: Number(w.fxFeePercent),
    gasFeeAmount: Number(w.gasFeeAmount),
    transferFeeAmount: Number(w.transferFeeAmount),
    otherFeeAmount: Number(w.otherFeeAmount),
    platformFeeAmount: Number(w.platformFeeAmount),
  };
}

function serializeWalletPublic(w: Parameters<typeof serializeWallet>[0]) {
  return {
    id: w.id,
    userId: w.userId,
    label: w.label,
    address: w.address,
    network: w.network,
    isDefault: w.isDefault,
    isActive: w.isActive,
    hqRegistered: w.hqRegistered,
    approvalStatus: w.approvalStatus,
    feeCurrency: w.feeCurrency,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    feesVisible: false as const,
  };
}

function serializeWalletWithFees(
  w: Parameters<typeof serializeWallet>[0],
  hq: Awaited<ReturnType<typeof getHqTransactionFees>>,
  gasPolicy: Awaited<ReturnType<typeof getGasNetworkPolicy>>,
  feesVisible: boolean,
) {
  if (!feesVisible) return serializeWalletPublic(w);
  return {
    ...serializeWallet(w),
    feesVisible: true as const,
    effectiveFees: resolveTransactionFees(w, withNetworkGasFee(hq, w.network, gasPolicy)),
  };
}

router.use(authenticate);
router.use(requireRoles(UserRole.CUSTOMER));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ownerId = merchantScopeUserId(req.user!);
    const [wallets, hq, gasPolicy, profile] = await Promise.all([
      prisma.wallet.findMany({
        where: { userId: ownerId, isActive: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      }),
      getHqTransactionFees(),
      getGasNetworkPolicy(),
      prisma.customerProfile.findUnique({
        where: { userId: ownerId },
        select: { walletFeesVisible: true },
      }),
    ]);
    const feesVisible = profile?.walletFeesVisible === true;

    res.json(wallets.map((w) => serializeWalletWithFees(w, hq, gasPolicy, feesVisible)));
  }),
);

router.post(
  '/',
  requireSensitiveOtp,
  asyncHandler(async (req, res) => {
    if (!isMerchantAdmin(req.user!)) {
      throw new AppError(403, 'Merchant admin only', 'FORBIDDEN');
    }
    const data = createWalletSchema.parse(req.body);
    const ownerId = merchantScopeUserId(req.user!);

    const wallet = await prisma.wallet.create({
      data: {
        userId: ownerId,
        label: data.label,
        address: data.address,
        network: data.network,
        isDefault: false,
        hqRegistered: false,
        approvalStatus: WalletApprovalStatus.PENDING,
        fxFeePercent: data.fxFeePercent,
        gasFeeAmount: data.gasFeeAmount,
        transferFeeAmount: data.transferFeeAmount,
        otherFeeAmount: data.otherFeeAmount,
        platformFeeAmount: data.platformFeeAmount,
      },
    });

    await recordMerchantOperation({
      actorId: req.user!.id,
      merchantAdminUserId: ownerId,
      action: 'WALLET_CREATE',
      entityType: 'Wallet',
      entityId: wallet.id,
      summary: `Add wallet ${wallet.network} ${wallet.address.slice(0, 8)}… (pending HQ approval)`,
      after: serializeWallet(wallet) as unknown as Prisma.InputJsonValue,
      otpVerified: true,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    res.status(201).json(serializeWallet(wallet));
  }),
);

router.patch(
  '/:id',
  requireSensitiveOtp,
  asyncHandler(async (req, res) => {
    if (!isMerchantAdmin(req.user!)) {
      throw new AppError(403, 'Merchant admin only', 'FORBIDDEN');
    }
    const data = updateWalletSchema.parse(req.body);
    const ownerId = merchantScopeUserId(req.user!);

    const existing = await prisma.wallet.findFirst({
      where: { id: req.params.id, userId: ownerId, isActive: true },
    });

    if (!existing) {
      throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
    }

    if (data.isDefault) {
      if (existing.approvalStatus !== WalletApprovalStatus.APPROVED) {
        throw new AppError(400, 'Only approved wallets can be set as default', 'VALIDATION');
      }
      await prisma.wallet.updateMany({
        where: { userId: ownerId },
        data: { isDefault: false },
      });
    }

    const wallet = await prisma.wallet.update({
      where: { id: existing.id },
      data: {
        label: data.label,
        isDefault: data.isDefault,
        fxFeePercent: data.fxFeePercent,
        gasFeeAmount: data.gasFeeAmount,
        transferFeeAmount: data.transferFeeAmount,
        otherFeeAmount: data.otherFeeAmount,
        platformFeeAmount: data.platformFeeAmount,
      },
    });

    await recordMerchantOperation({
      actorId: req.user!.id,
      merchantAdminUserId: ownerId,
      action: data.isDefault ? 'WALLET_SET_DEFAULT' : 'WALLET_UPDATE',
      entityType: 'Wallet',
      entityId: wallet.id,
      summary: data.isDefault
        ? `Switch default wallet to ${wallet.network} ${wallet.address.slice(0, 8)}…`
        : `Update wallet ${wallet.id}`,
      before: { isDefault: existing.isDefault },
      after: { isDefault: wallet.isDefault },
      otpVerified: true,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    res.json(serializeWallet(wallet));
  }),
);

export default router;

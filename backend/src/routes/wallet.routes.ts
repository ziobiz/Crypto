import { Router } from 'express';
import { z } from 'zod';
import { UserRole, WalletApprovalStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { requireSensitiveOtp } from '../middleware/sensitiveOtp';
import { isMerchantAdmin, merchantScopeUserId } from '../lib/merchant-role';
import { recordMerchantOperation } from '../services/merchant-operation-log.service';
import { getGasNetworkPolicy, getHqTransactionFees, resolveTransactionFees, withNetworkGasFee } from '../services/transaction-fee.service';
import { assertCustomerTradeAllowed } from '../services/customer-access.service';
import {
  changeMerchantWalletAddress,
  registerMerchantWallet,
  renameMerchantWalletNickname,
  requestMerchantWalletDeletion,
} from '../services/wallet-policy.service';

const router = Router();

const feeFields = {
  fxFeePercent: z.number().min(0).max(100).default(0),
  gasFeeAmount: z.number().min(0).default(0),
  transferFeeAmount: z.number().min(0).default(0),
  otherFeeAmount: z.number().min(0).default(0),
  platformFeeAmount: z.number().min(0).default(0),
};

const createWalletSchema = z.object({
  label: z.string().trim().min(1).max(40),
  address: z.string().min(10),
  network: z.string().default('TRC20'),
  isDefault: z.boolean().optional(),
  ...feeFields,
});

const nicknameSchema = z.object({
  label: z.string().trim().min(1).max(40),
});

const updateWalletSchema = z.object({
  label: z.string().trim().min(1).max(40).optional(),
  address: z.string().min(10).optional(),
  network: z.string().optional(),
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
  deleteRequestedAt?: Date | null;
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
    await assertCustomerTradeAllowed(req.user!);
    const data = createWalletSchema.parse(req.body);
    const ownerId = merchantScopeUserId(req.user!);
    const wallet = await registerMerchantWallet(ownerId, {
      actorId: req.user!.id,
      label: data.label,
      address: data.address,
      network: data.network,
      fees: {
        fxFeePercent: data.fxFeePercent,
        gasFeeAmount: data.gasFeeAmount,
        transferFeeAmount: data.transferFeeAmount,
        otherFeeAmount: data.otherFeeAmount,
        platformFeeAmount: data.platformFeeAmount,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    res.status(201).json(serializeWallet(wallet));
  }),
);

/** 닉네임만 변경 (OTP 없음) */
router.patch(
  '/:id/nickname',
  asyncHandler(async (req, res) => {
    if (!isMerchantAdmin(req.user!)) {
      throw new AppError(403, 'Merchant admin only', 'FORBIDDEN');
    }
    const data = nicknameSchema.parse(req.body);
    const ownerId = merchantScopeUserId(req.user!);
    const wallet = await renameMerchantWalletNickname(ownerId, req.params.id, data.label, {
      actorId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    res.json(serializeWallet(wallet));
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

    if (data.address) {
      const wallet = await changeMerchantWalletAddress(ownerId, existing.id, {
        actorId: req.user!.id,
        address: data.address,
        network: data.network || existing.network,
        label: data.label,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
      });
      res.json(serializeWallet(wallet));
      return;
    }

    if (data.isDefault) {
      if (existing.deleteRequestedAt) {
        throw new AppError(400, '삭제 요청 중인 지갑은 기본으로 지정할 수 없습니다', 'WALLET_DELETE_PENDING');
      }
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
        ...(data.label !== undefined ? { label: data.label } : {}),
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
      before: { isDefault: existing.isDefault, label: existing.label },
      after: { isDefault: wallet.isDefault, label: wallet.label },
      otpVerified: true,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    res.json(serializeWallet(wallet));
  }),
);

router.post(
  '/:id/delete-request',
  requireSensitiveOtp,
  asyncHandler(async (req, res) => {
    if (!isMerchantAdmin(req.user!)) {
      throw new AppError(403, 'Merchant admin only', 'FORBIDDEN');
    }
    const ownerId = merchantScopeUserId(req.user!);
    const wallet = await requestMerchantWalletDeletion(ownerId, req.params.id, {
      actorId: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    res.json(serializeWallet(wallet));
  }),
);

export default router;

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
  defaultNetworkForAsset,
  registerMerchantWallet,
  renameMerchantWalletNickname,
  requestMerchantWalletDeletion,
} from '../services/wallet-policy.service';
import { getSettlementAsset, normalizeSettlementAsset } from '../services/settlement-asset.service';

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
  network: z.string().optional(),
  assetType: z.enum(['USDT', 'USDC']).optional(),
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
  assetType: z.enum(['USDT', 'USDC']).optional(),
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
  assetType?: string;
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
    assetType: w.assetType ?? 'USDT',
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
    assetType: w.assetType ?? 'USDT',
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
  gasPolicyUsdt: Awaited<ReturnType<typeof getGasNetworkPolicy>>,
  gasPolicyUsdc: Awaited<ReturnType<typeof getGasNetworkPolicy>>,
  feesVisible: boolean,
) {
  if (!feesVisible) return serializeWalletPublic(w);
  const gasPolicy = (w.assetType ?? 'USDT') === 'USDC' ? gasPolicyUsdc : gasPolicyUsdt;
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
    /** assetType 또는 forApply=1 일 때만 본사 정산자산으로 필터 (관리 목록은 전체) */
    let assetFilter: 'USDT' | 'USDC' | undefined;
    if (req.query.assetType != null && String(req.query.assetType).trim() !== '') {
      assetFilter = normalizeSettlementAsset(req.query.assetType);
    } else if (String(req.query.forApply ?? '') === '1') {
      assetFilter = await getSettlementAsset();
    }
    const { ensurePrimaryWalletForAsset } = await import('../services/wallet-policy.service');
    if (assetFilter) {
      await ensurePrimaryWalletForAsset(ownerId, assetFilter);
    } else {
      await Promise.all([
        ensurePrimaryWalletForAsset(ownerId, 'USDT'),
        ensurePrimaryWalletForAsset(ownerId, 'USDC'),
      ]);
    }
    const [wallets, hq, gasPolicyUsdt, gasPolicyUsdc, profile] = await Promise.all([
      prisma.wallet.findMany({
        where: {
          userId: ownerId,
          isActive: true,
          ...(assetFilter ? { assetType: assetFilter } : {}),
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      }),
      getHqTransactionFees(),
      getGasNetworkPolicy('USDT'),
      getGasNetworkPolicy('USDC'),
      prisma.customerProfile.findUnique({
        where: { userId: ownerId },
        select: { walletFeesVisible: true },
      }),
    ]);
    const feesVisible = profile?.walletFeesVisible === true;

    res.json(
      wallets.map((w) => serializeWalletWithFees(w, hq, gasPolicyUsdt, gasPolicyUsdc, feesVisible)),
    );
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
    const assetType = data.assetType
      ? normalizeSettlementAsset(data.assetType)
      : await getSettlementAsset();
    const network = data.network || defaultNetworkForAsset(assetType);
    const wallet = await registerMerchantWallet(ownerId, {
      actorId: req.user!.id,
      label: data.label,
      address: data.address,
      network,
      assetType,
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

    if (data.address || data.network || data.assetType) {
      /** assetType 변경 시도는 changeMerchantWalletAddress 에서 WALLET_ASSET_LOCKED */
      const wallet = await changeMerchantWalletAddress(ownerId, existing.id, {
        actorId: req.user!.id,
        address: data.address || existing.address,
        network: data.network || existing.network,
        assetType: data.assetType,
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
      // 기본값은 자산(USDT/USDC)별로 각각 1개 — 거래 시 해당 자산 기본 지갑이 먼저 선택됨
      await prisma.wallet.updateMany({
        where: {
          userId: ownerId,
          assetType: existing.assetType ?? 'USDT',
        },
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

import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { getHqTransactionFees, resolveTransactionFees } from '../services/transaction-fee.service';

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

function serializeWallet(w: {
  id: string;
  userId: string;
  label: string | null;
  address: string;
  network: string;
  isDefault: boolean;
  isActive: boolean;
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

function serializeWalletWithFees(
  w: Parameters<typeof serializeWallet>[0],
  hq: Awaited<ReturnType<typeof getHqTransactionFees>>,
) {
  return {
    ...serializeWallet(w),
    effectiveFees: resolveTransactionFees(w, hq),
  };
}

router.use(authenticate);
router.use(requireRoles(UserRole.CUSTOMER));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [wallets, hq] = await Promise.all([
      prisma.wallet.findMany({
        where: { userId: req.user!.id, isActive: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      }),
      getHqTransactionFees(),
    ]);

    res.json(wallets.map((w) => serializeWalletWithFees(w, hq)));
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createWalletSchema.parse(req.body);

    if (data.isDefault) {
      await prisma.wallet.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId: req.user!.id,
        label: data.label,
        address: data.address,
        network: data.network,
        isDefault: data.isDefault ?? false,
        fxFeePercent: data.fxFeePercent,
        gasFeeAmount: data.gasFeeAmount,
        transferFeeAmount: data.transferFeeAmount,
        otherFeeAmount: data.otherFeeAmount,
        platformFeeAmount: data.platformFeeAmount,
      },
    });

    res.status(201).json(serializeWallet(wallet));
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const updateSchema = createWalletSchema.partial();
    const data = updateSchema.parse(req.body);

    const existing = await prisma.wallet.findFirst({
      where: { id: req.params.id, userId: req.user!.id, isActive: true },
    });

    if (!existing) {
      throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
    }

    if (data.isDefault) {
      await prisma.wallet.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }

    const wallet = await prisma.wallet.update({
      where: { id: existing.id },
      data,
    });

    res.json(serializeWallet(wallet));
  }),
);

export default router;

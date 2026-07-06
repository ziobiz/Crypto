import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

const createWalletSchema = z.object({
  label: z.string().optional(),
  address: z.string().min(10),
  network: z.string().default('TRC20'),
  isDefault: z.boolean().optional(),
  gasFeeAmount: z.number().min(0).default(0),
  platformFeeAmount: z.number().min(0).default(0),
});

router.use(authenticate);
router.use(requireRoles(UserRole.CUSTOMER));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const wallets = await prisma.wallet.findMany({
      where: { userId: req.user!.id, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(
      wallets.map((w) => ({
        ...w,
        gasFeeAmount: Number(w.gasFeeAmount),
        platformFeeAmount: Number(w.platformFeeAmount),
      })),
    );
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
        gasFeeAmount: data.gasFeeAmount,
        platformFeeAmount: data.platformFeeAmount,
      },
    });

    res.status(201).json({
      ...wallet,
      gasFeeAmount: Number(wallet.gasFeeAmount),
      platformFeeAmount: Number(wallet.platformFeeAmount),
    });
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

    res.json({
      ...wallet,
      gasFeeAmount: Number(wallet.gasFeeAmount),
      platformFeeAmount: Number(wallet.platformFeeAmount),
    });
  }),
);

export default router;

import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AttachmentPurpose, UsdtPurchaseStatus, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { getExchangeRateDisplay } from '../services/exchange-rate.service';
import {
  createUsdtPurchaseTicket,
  getUsdtPurchaseTicket,
  listUsdtPurchaseTickets,
  transitionUsdtPurchaseStatus,
} from '../services/usdt-purchase.service';
import { assertTicketAccess } from '../services/ticket-access.service';
import { saveAttachment } from '../services/attachment.service';
import { AppError } from '../lib/errors';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF allowed'));
    }
  },
});

router.use(authenticate);

router.get(
  '/exchange-rate',
  asyncHandler(async (_req, res) => {
    const rate = await getExchangeRateDisplay();
    res.json(rate);
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tickets = await listUsdtPurchaseTickets(req.user!);
    res.json(tickets);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ticket = await getUsdtPurchaseTicket(req.user!, req.params.id);
    res.json(ticket);
  }),
);

router.post(
  '/',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      fiatAmount: z.number().positive(),
      fiatCurrency: z.enum(['KRW', 'USD']).optional(),
      walletId: z.string().min(1),
    });
    const body = schema.parse(req.body);
    const ticket = await createUsdtPurchaseTicket(req.user!, body);
    res.status(201).json(ticket);
  }),
);

const statusSchema = z.object({
  status: z.nativeEnum(UsdtPurchaseStatus),
  usdtTxId: z.string().optional(),
  actualUsdtAmount: z.number().positive().optional(),
  adminNote: z.string().optional(),
});

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const body = statusSchema.parse(req.body);
    const user = req.user!;

    const adminOnlyStatuses: UsdtPurchaseStatus[] = [
      UsdtPurchaseStatus.ADMIN_REVIEWING,
      UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
      UsdtPurchaseStatus.COMPLETED,
    ];

    if (adminOnlyStatuses.includes(body.status) && user.role !== UserRole.SUPER_ADMIN) {
      throw new AppError(403, 'Admin only status change', 'FORBIDDEN');
    }

    const ticket = await transitionUsdtPurchaseStatus(user, req.params.id, body.status, {
      usdtTxId: body.usdtTxId ?? undefined,
      actualUsdtAmount: body.actualUsdtAmount ?? undefined,
      adminNote: body.adminNote ?? undefined,
    });
    res.json(ticket);
  }),
);

router.post(
  '/:id/deposit-proof',
  requireRoles(UserRole.CUSTOMER),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError(400, 'File is required', 'VALIDATION_ERROR');
    }

    const ticketId = req.params.id;
    await assertTicketAccess(req.user!, ticketId);

    await saveAttachment(
      req.user!,
      ticketId,
      req.file,
      AttachmentPurpose.FIAT_DEPOSIT_RECEIPT,
      req.body.description,
    );

    const ticket = await transitionUsdtPurchaseStatus(
      req.user!,
      ticketId,
      UsdtPurchaseStatus.ADMIN_REVIEWING,
    );

    res.json(ticket);
  }),
);

export default router;

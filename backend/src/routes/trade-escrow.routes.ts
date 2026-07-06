import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AttachmentPurpose, TradeEscrowStatus, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import {
  createTradeEscrowTicket,
  getTradeEscrowTicket,
  listTradeEscrowTickets,
  transitionTradeEscrowStatus,
} from '../services/trade-escrow.service';
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
  '/',
  asyncHandler(async (req, res) => {
    const tickets = await listTradeEscrowTickets(req.user!);
    res.json(tickets);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ticket = await getTradeEscrowTicket(req.user!, req.params.id);
    res.json(ticket);
  }),
);

router.post(
  '/',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      sellerEmail: z.string().email(),
      title: z.string().min(1),
      description: z.string().optional(),
      amount: z.number().positive(),
      currency: z.enum(['KRW', 'USD']).optional(),
      totalCommissionPool: z.number().min(0).optional(),
    });
    const body = schema.parse(req.body);
    const ticket = await createTradeEscrowTicket(req.user!, body);
    res.status(201).json(ticket);
  }),
);

const statusSchema = z.object({
  status: z.nativeEnum(TradeEscrowStatus),
  payoutTxId: z.string().optional(),
  sellerPayoutAccount: z.string().optional(),
  adminNote: z.string().optional(),
});

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const body = statusSchema.parse(req.body);
    const ticket = await transitionTradeEscrowStatus(req.user!, req.params.id, body.status, {
      payoutTxId: body.payoutTxId ?? undefined,
      sellerPayoutAccount: body.sellerPayoutAccount ?? undefined,
      adminNote: body.adminNote ?? undefined,
    });
    res.json(ticket);
  }),
);

router.post(
  '/:id/buyer-deposit-proof',
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

    const ticket = await getTradeEscrowTicket(req.user!, ticketId);
    res.json(ticket);
  }),
);

router.post(
  '/:id/seller-fulfillment-proof',
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
      AttachmentPurpose.SHIPPING_PROOF,
      req.body.description,
    );

    const ticket = await transitionTradeEscrowStatus(
      req.user!,
      ticketId,
      TradeEscrowStatus.SELLER_FULFILLMENT_PROOF,
    );
    res.json(ticket);
  }),
);

router.post(
  '/:id/buyer-approval',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const ticket = await transitionTradeEscrowStatus(
      req.user!,
      req.params.id,
      TradeEscrowStatus.BUYER_FINAL_APPROVAL,
    );
    res.json(ticket);
  }),
);

export default router;

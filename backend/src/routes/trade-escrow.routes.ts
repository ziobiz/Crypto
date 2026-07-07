import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AttachmentPurpose, TradeEscrowStatus, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import {
  ESCROW_CURRENCIES,
  acceptEscrowParty,
  approveEscrowReceipt,
  createTradeEscrowTicket,
  getEscrowDepositContext,
  getTradeEscrowTicket,
  listTradeEscrowTickets,
  lookupEscrowMember,
  openEscrowDeposit,
  previewEscrowFees,
  rejectEscrowParty,
  saveBuyerDepositMetadata,
  startEscrowShipping,
  transitionTradeEscrowStatus,
} from '../services/trade-escrow.service';
import { assertTicketAccess } from '../services/ticket-access.service';
import { saveAttachment } from '../services/attachment.service';
import { AppError } from '../lib/errors';
import { isEscrowBuyer, isEscrowSeller } from '../services/ticket-access.service';
import { prisma } from '../lib/prisma';

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

const currencySchema = z.enum(ESCROW_CURRENCIES);

router.use(authenticate);

router.get(
  '/lookup-member',
  asyncHandler(async (req, res) => {
    const email = z.string().email().parse(req.query.email);
    res.json(await lookupEscrowMember(email));
  }),
);

router.get(
  '/preview-fees',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const amount = z.coerce.number().positive().parse(req.query.amount);
    const currency = currencySchema.parse(req.query.currency ?? 'KRW');
    res.json(await previewEscrowFees(req.user!, amount, currency));
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await listTradeEscrowTickets(req.user!));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getTradeEscrowTicket(req.user!, req.params.id));
  }),
);

router.get(
  '/:id/deposit-context',
  asyncHandler(async (req, res) => {
    res.json(await getEscrowDepositContext(req.user!, req.params.id));
  }),
);

router.post(
  '/',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      counterpartyEmail: z.string().email(),
      myRole: z.enum(['BUYER', 'SELLER']),
      title: z.string().min(1),
      description: z.string().optional(),
      escrowTerms: z.string().optional(),
      amount: z.number().positive(),
      currency: currencySchema.optional(),
      deliveryTerms: z.string().optional(),
      deliveryDeadline: z.string().optional(),
      disclaimerAccepted: z.literal(true),
      retryParentTicketId: z.string().optional(),
      sellerEmail: z.string().email().optional(),
    });
    const body = schema.parse(req.body);
    const counterpartyEmail = body.counterpartyEmail ?? body.sellerEmail;
    if (!counterpartyEmail) {
      throw new AppError(400, 'counterpartyEmail is required', 'VALIDATION_ERROR');
    }
    const ticket = await createTradeEscrowTicket(req.user!, {
      ...body,
      counterpartyEmail,
    });
    res.status(201).json(ticket);
  }),
);

router.post(
  '/:id/accept',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const { disclaimerAccepted } = z.object({ disclaimerAccepted: z.literal(true) }).parse(req.body);
    res.json(await acceptEscrowParty(req.user!, req.params.id, { disclaimerAccepted }));
  }),
);

router.post(
  '/:id/reject',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const reason = z.object({ reason: z.string().optional() }).parse(req.body).reason;
    res.json(await rejectEscrowParty(req.user!, req.params.id, reason));
  }),
);

router.post(
  '/:id/open-deposit',
  asyncHandler(async (req, res) => {
    res.json(await openEscrowDeposit(req.user!, req.params.id));
  }),
);

router.post(
  '/:id/start-shipping',
  requireRoles(UserRole.CUSTOMER),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const ticketId = req.params.id;
    if (req.file) {
      await assertTicketAccess(req.user!, ticketId);
      await saveAttachment(req.user!, ticketId, req.file, AttachmentPurpose.SHIPPING_PROOF, req.body.description);
    }
    res.json(await startEscrowShipping(req.user!, ticketId));
  }),
);

router.post(
  '/:id/buyer-approval',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const body = z.object({ sellerPayoutAccount: z.string().optional() }).parse(req.body ?? {});
    res.json(await approveEscrowReceipt(req.user!, req.params.id, body));
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
    res.json(
      await transitionTradeEscrowStatus(req.user!, req.params.id, body.status, {
        payoutTxId: body.payoutTxId,
        sellerPayoutAccount: body.sellerPayoutAccount,
        adminNote: body.adminNote,
      }),
    );
  }),
);

router.post(
  '/:id/buyer-deposit-proof',
  requireRoles(UserRole.CUSTOMER),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError(400, 'File is required', 'VALIDATION_ERROR');

    const ticketId = req.params.id;
    const detail = await prisma.tradeEscrowDetail.findFirst({ where: { ticketId } });
    if (!detail) throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
    if (!isEscrowBuyer(req.user!, detail.buyerId)) {
      throw new AppError(403, 'Only buyer can upload deposit proof', 'FORBIDDEN');
    }

    const purpose =
      detail.currency === 'USDT'
        ? AttachmentPurpose.USDT_TRANSFER_PROOF
        : AttachmentPurpose.FIAT_DEPOSIT_RECEIPT;

    await assertTicketAccess(req.user!, ticketId);
    await saveAttachment(req.user!, ticketId, req.file, purpose, req.body.description);

    if (req.body.depositAmount || req.body.depositorName || req.body.depositTransferredAt) {
      await saveBuyerDepositMetadata(req.user!, ticketId, {
        depositAmount: req.body.depositAmount ? Number(req.body.depositAmount) : undefined,
        depositorName: req.body.depositorName,
        depositTransferredAt: req.body.depositTransferredAt,
      });
    }

    res.json(await getTradeEscrowTicket(req.user!, ticketId));
  }),
);

// 레거시 호환
router.post('/:id/seller-accept', requireRoles(UserRole.CUSTOMER), asyncHandler(async (req, res) => {
  res.json(await acceptEscrowParty(req.user!, req.params.id, { disclaimerAccepted: true }));
}));
router.post('/:id/seller-reject', requireRoles(UserRole.CUSTOMER), asyncHandler(async (req, res) => {
  const reason = z.object({ reason: z.string().optional() }).parse(req.body).reason;
  res.json(await rejectEscrowParty(req.user!, req.params.id, reason));
}));
router.post('/:id/open-funding', asyncHandler(async (req, res) => {
  const ticket = await openEscrowDeposit(req.user!, req.params.id);
  res.json(ticket);
}));

export default router;

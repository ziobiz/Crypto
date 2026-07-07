import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AttachmentPurpose, UsdtPurchaseStatus, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import {
  getAllExchangeRatesDisplay,
  getExchangeRateDisplay,
  SUPPORTED_FIAT_CURRENCIES,
  type FiatCurrency,
} from '../services/exchange-rate.service';
import {
  createUsdtPurchaseTicket,
  getUsdtDepositContext,
  getUsdtPurchaseTicket,
  listUsdtPurchaseTickets,
  previewUsdtTransactionFees,
  saveDepositProofMetadata,
  transitionUsdtPurchaseStatus,
} from '../services/usdt-purchase.service';
import {
  createUsdtCardPurchase,
  getUsdtCardPaymentContext,
  previewUsdtCardFees,
} from '../services/usdt-card-purchase.service';
import { assertTicketAccess, canOperateUsdtTicket } from '../services/ticket-access.service';
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
  asyncHandler(async (req, res) => {
    const all = req.query.all === 'true';
    if (all) {
      res.json(await getAllExchangeRatesDisplay());
      return;
    }
    const currency = (req.query.currency as FiatCurrency) || 'JPY';
    const rate = await getExchangeRateDisplay(currency);
    res.json(rate);
  }),
);

router.get(
  '/card-context',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    res.json(await getUsdtCardPaymentContext(req.user!));
  }),
);

router.get(
  '/fees',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const currency = (req.query.currency as FiatCurrency) || 'JPY';
    const walletId = String(req.query.walletId ?? '');
    const fiatAmount = req.query.fiatAmount != null ? Number(req.query.fiatAmount) : undefined;
    const targetUsdtAmount =
      req.query.targetUsdtAmount != null ? Number(req.query.targetUsdtAmount) : undefined;
    const cardChargeFiat =
      req.query.cardChargeFiat != null ? Number(req.query.cardChargeFiat) : undefined;
    const paymentMethod = String(req.query.paymentMethod ?? 'BANK');
    if (!walletId) {
      throw new AppError(400, 'walletId required', 'VALIDATION_ERROR');
    }
    if (paymentMethod === 'CARD') {
      res.json(
        await previewUsdtCardFees(req.user!, {
          walletId,
          fiatCurrency: currency,
          targetUsdtAmount,
          cardChargeFiat,
        }),
      );
      return;
    }
    res.json(
      await previewUsdtTransactionFees(req.user!, {
        walletId,
        fiatCurrency: currency,
        fiatAmount,
        targetUsdtAmount,
      }),
    );
  }),
);

router.get(
  '/deposit-context',
  asyncHandler(async (req, res) => {
    res.json(await getUsdtDepositContext(req.user!));
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

const cardSchema = z.object({
  cardNumber: z.string().min(13),
  cardExpiry: z.string().min(4),
  cardCvv: z.string().min(3).max(4),
  cardholderName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  phoneCountryCode: z.string().min(1),
});

const createSchema = z
  .object({
    fiatAmount: z.number().positive().optional(),
    targetUsdtAmount: z.number().positive().optional(),
    cardChargeFiat: z.number().positive().optional(),
    fiatCurrency: z.enum(SUPPORTED_FIAT_CURRENCIES as unknown as [string, ...string[]]).optional(),
    walletId: z.string().min(1),
    paymentMethod: z.enum(['BANK_TRANSFER', 'CARD']).optional(),
    cardWaiverAccepted: z.literal(true).optional(),
    card: cardSchema.optional(),
  })
  .refine((d) => d.fiatAmount != null || d.targetUsdtAmount != null || d.cardChargeFiat != null, {
    message: 'fiatAmount, targetUsdtAmount, or cardChargeFiat required',
  });

router.post(
  '/',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    if (body.paymentMethod === 'CARD') {
      if (!body.card || !body.cardWaiverAccepted) {
        throw new AppError(400, 'Card details and waiver required', 'VALIDATION_ERROR');
      }
      const ticket = await createUsdtCardPurchase(req.user!, {
        walletId: body.walletId,
        fiatCurrency: body.fiatCurrency as FiatCurrency | undefined,
        targetUsdtAmount: body.targetUsdtAmount,
        cardChargeFiat: body.cardChargeFiat,
        card: body.card,
        cardWaiverAccepted: true,
      });
      res.status(201).json(ticket);
      return;
    }
    const ticket = await createUsdtPurchaseTicket(req.user!, {
      fiatAmount: body.fiatAmount,
      targetUsdtAmount: body.targetUsdtAmount,
      fiatCurrency: body.fiatCurrency as FiatCurrency | undefined,
      walletId: body.walletId,
    });
    res.status(201).json(ticket);
  }),
);

const statusSchema = z.object({
  status: z.nativeEnum(UsdtPurchaseStatus),
  usdtTxId: z.string().optional(),
  actualUsdtAmount: z.number().positive().optional(),
  adminNote: z.string().optional(),
  cancelReason: z.string().optional(),
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
      UsdtPurchaseStatus.CANCELLED,
    ];

    if (adminOnlyStatuses.includes(body.status) && !canOperateUsdtTicket(user)) {
      throw new AppError(403, 'Operator role required', 'FORBIDDEN');
    }

    const ticket = await transitionUsdtPurchaseStatus(user, req.params.id, body.status, {
      usdtTxId: body.usdtTxId ?? undefined,
      actualUsdtAmount: body.actualUsdtAmount ?? undefined,
      adminNote: body.adminNote ?? undefined,
      cancelReason: body.cancelReason ?? undefined,
    });
    res.json(ticket);
  }),
);

const depositProofSchema = z.object({
  depositAmount: z.coerce.number().positive().optional(),
  depositorName: z.string().min(1).optional(),
  depositTransferredAt: z.string().optional(),
  description: z.string().optional(),
});

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

    const meta = depositProofSchema.parse(req.body);

    const { bankMismatch } = await saveDepositProofMetadata(req.user!, ticketId, {
      depositAmount: meta.depositAmount,
      depositorName: meta.depositorName,
      depositTransferredAt: meta.depositTransferredAt,
    });

    await saveAttachment(
      req.user!,
      ticketId,
      req.file,
      AttachmentPurpose.FIAT_DEPOSIT_RECEIPT,
      meta.description,
    );

    const ticket = await transitionUsdtPurchaseStatus(
      req.user!,
      ticketId,
      UsdtPurchaseStatus.ADMIN_REVIEWING,
      bankMismatch
        ? { adminNote: '등록 통장과 입금자명 불일치 — 관리자 확인 필요' }
        : undefined,
    );

    res.json({ ...ticket, bankMismatch });
  }),
);

export default router;

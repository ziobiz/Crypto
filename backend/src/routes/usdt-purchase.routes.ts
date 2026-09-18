import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AttachmentPurpose, UsdtPurchaseStatus } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { MERCHANT_TRADE_ROLES } from '../lib/merchant-role';
import {
  getAllExchangeRatesDisplay,
  getExchangeRateDisplay,
  SUPPORTED_FIAT_CURRENCIES,
  type FiatCurrency,
} from '../services/exchange-rate.service';
import {
  createUsdtPurchaseTicket,
  confirmUsdtQuote,
  getUsdtDepositContext,
  getUsdtPurchaseTicket,
  listUsdtPurchaseTickets,
  previewUsdtTransactionFees,
  saveDepositProofMetadata,
  simulateHqUsdtQuote,
  transitionUsdtPurchaseStatus,
} from '../services/usdt-purchase.service';
import {
  simulateSandboxCurfexDeposit,
  syncCurfexDepositForTicket,
} from '../services/curfex-webhook.service';
import { assertCanUseUsdtSimulator } from '../services/simulator-access.service';
import {
  assertSimulatorFeeModeAllowed,
  feePolicyFromMode,
} from '../services/simulator-rate.service';
import { prisma } from '../lib/prisma';
import {
  createUsdtCardPurchase,
  getUsdtCardPaymentContext,
  previewUsdtCardFees,
} from '../services/usdt-card-purchase.service';
import { assertTicketAccess, canOperateUsdtTicket } from '../services/ticket-access.service';
import { saveAttachment } from '../services/attachment.service';
import { hqPolicyService } from '../services/hq-policy.service';
import { AppError } from '../lib/errors';
import { setBrokerUsdt } from '../services/profit-analysis.service';
import { isCostAnalysisRole } from '../constants/hq-admin';

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

const APPLICATION_DOC_EXTS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.xlsx', '.xls']);

function isApplicationDocFile(file: Express.Multer.File): boolean {
  const name = file.originalname.toLowerCase();
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  if (APPLICATION_DOC_EXTS.has(ext)) return true;
  return (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel'
  );
}

const applicationDocUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isApplicationDocFile(file)) cb(null, true);
    else cb(new Error('PDF, Excel, or image required'));
  },
});

router.use(authenticate);

router.get(
  '/simulate',
  asyncHandler(async (req, res) => {
    await assertCanUseUsdtSimulator(req.user!);
    const currency = (req.query.currency as FiatCurrency) || 'JPY';
    const fiatAmount = req.query.fiatAmount != null ? Number(req.query.fiatAmount) : undefined;
    const targetUsdtAmount =
      req.query.targetUsdtAmount != null ? Number(req.query.targetUsdtAmount) : undefined;
    const network = String(req.query.network ?? '').trim();
    const feeMode = await assertSimulatorFeeModeAllowed(
      req.user!,
      req.query.feeMode != null ? String(req.query.feeMode) : null,
    );
    if (!network) {
      throw new AppError(400, 'Withdrawal network is required', 'NETWORK_REQUIRED');
    }
    const role = req.user!.role;
    const isMerchantCustomer = role === 'CUSTOMER' || role === 'CUSTOMER_OPERATOR';
    res.json(
      await simulateHqUsdtQuote({
        fiatCurrency: currency,
        fiatAmount,
        targetUsdtAmount,
        network,
        feePolicy: feePolicyFromMode(feeMode),
        customerProfileId: isMerchantCustomer ? req.user!.customerProfileId : null,
        enforceCustomerLimits: isMerchantCustomer,
      }),
    );
  }),
);

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
  requireRoles(...MERCHANT_TRADE_ROLES),
  asyncHandler(async (req, res) => {
    res.json(await getUsdtCardPaymentContext(req.user!));
  }),
);

router.get(
  '/fees',
  requireRoles(...MERCHANT_TRADE_ROLES),
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
    await hqPolicyService.assertUsdtFiatMethodEnabled(currency, 'TRANSFER');
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
  requireRoles(...MERCHANT_TRADE_ROLES),
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
  amountConfirmAcknowledged: z.boolean().optional(),
});

router.post(
  '/:id/curfex-sync',
  asyncHandler(async (req, res) => {
    await assertTicketAccess(req.user!, req.params.id);
    res.json(await syncCurfexDepositForTicket(req.params.id));
  }),
);

router.post(
  '/:id/curfex-sandbox-deposit',
  asyncHandler(async (req, res) => {
    await assertTicketAccess(req.user!, req.params.id);
    // Customer or operator can simulate in sandbox to test the flow
    res.json(await simulateSandboxCurfexDeposit(req.params.id));
  }),
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const body = statusSchema.parse(req.body);
    const user = req.user!;

    const adminOnlyStatuses: UsdtPurchaseStatus[] = [
      UsdtPurchaseStatus.QUOTE_CONFIRMED,
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
      amountConfirmAcknowledged: body.amountConfirmAcknowledged ?? undefined,
    });
    res.json(ticket);
  }),
);

const confirmQuoteSchema = z.object({
  confirmedFiatAmount: z.number().positive().optional(),
  confirmedUsdtAmount: z.number().positive().optional(),
  adminNote: z.string().optional(),
});

router.post(
  '/:id/confirm-quote',
  asyncHandler(async (req, res) => {
    if (!canOperateUsdtTicket(req.user!)) {
      throw new AppError(403, 'Operator role required', 'FORBIDDEN');
    }
    const body = confirmQuoteSchema.parse(req.body ?? {});
    await assertTicketAccess(req.user!, req.params.id);
    res.json(
      await confirmUsdtQuote(req.user!, req.params.id, {
        confirmedFiatAmount: body.confirmedFiatAmount,
        confirmedUsdtAmount: body.confirmedUsdtAmount,
        adminNote: body.adminNote,
      }),
    );
  }),
);

router.patch(
  '/:id/broker-usdt',
  asyncHandler(async (req, res) => {
    if (!isCostAnalysisRole(req.user!.role)) {
      throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    }
    const amount = Number((req.body as { brokerUsdtAmount?: number }).brokerUsdtAmount);
    await setBrokerUsdt(req.user!, req.params.id, amount);
    res.json(await getUsdtPurchaseTicket(req.user!, req.params.id));
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
  requireRoles(...MERCHANT_TRADE_ROLES),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError(400, 'File is required', 'VALIDATION_ERROR');
    }

    const ticketId = req.params.id;
    await assertTicketAccess(req.user!, ticketId);

    const curfexDetail = await prisma.usdtPurchaseDetail.findUnique({
      where: { ticketId },
      select: { collectionProvider: true },
    });
    if (curfexDetail?.collectionProvider === 'CURFEX') {
      throw new AppError(
        400,
        'CURFEX tickets do not require deposit proof — wait for automatic deposit detection',
        'CURFEX_NO_PROOF',
      );
    }

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
      { fileIndex: 0 },
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

router.post(
  '/:id/application-docs',
  requireRoles(...MERCHANT_TRADE_ROLES),
  applicationDocUpload.fields([
    { name: 'sourceOfFunds', maxCount: 10 },
    { name: 'depositReceipt', maxCount: 5 },
  ]),
  asyncHandler(async (req, res) => {
    const ticketId = req.params.id;
    await assertTicketAccess(req.user!, ticketId);

    const detail = await prisma.usdtPurchaseDetail.findUnique({
      where: { ticketId },
      select: { collectionProvider: true, status: true },
    });
    const isCurfex = detail?.collectionProvider === 'CURFEX';
    if (
      detail?.status !== UsdtPurchaseStatus.QUOTE_CONFIRMED &&
      detail?.status !== UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING &&
      detail?.status !== UsdtPurchaseStatus.APPLICATION_COMPLETED
    ) {
      throw new AppError(400, 'Documents not accepted at this stage', 'INVALID_STATE');
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const sourceOfFunds = files?.sourceOfFunds ?? [];
    const depositReceipt = files?.depositReceipt ?? [];

    if (sourceOfFunds.length === 0) {
      throw new AppError(400, 'Source of funds document is required', 'VALIDATION_ERROR');
    }
    // 전용계좌(고정): 송금증(입금 영수증) 필수. 가상계좌(CURFEX)는 불필요.
    if (!isCurfex && depositReceipt.length === 0) {
      throw new AppError(400, 'Deposit receipt (remittance slip) is required', 'VALIDATION_ERROR');
    }

    for (let i = 0; i < sourceOfFunds.length; i++) {
      await saveAttachment(
        req.user!,
        ticketId,
        sourceOfFunds[i],
        AttachmentPurpose.SOURCE_OF_FUNDS_DOC,
        undefined,
        { fileIndex: i },
      );
    }
    for (let i = 0; i < depositReceipt.length; i++) {
      await saveAttachment(
        req.user!,
        ticketId,
        depositReceipt[i],
        AttachmentPurpose.FIAT_DEPOSIT_RECEIPT,
        undefined,
        { fileIndex: i },
      );
    }

    if (detail?.status === UsdtPurchaseStatus.QUOTE_CONFIRMED) {
      await transitionUsdtPurchaseStatus(
        req.user!,
        ticketId,
        UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
      );
    }

    // 고정계좌: 입금증 포함 시 심사로
    if (!isCurfex && depositReceipt.length > 0) {
      const ticket = await transitionUsdtPurchaseStatus(
        req.user!,
        ticketId,
        UsdtPurchaseStatus.ADMIN_REVIEWING,
      );
      res.json(ticket);
      return;
    }

    const ticket = await getUsdtPurchaseTicket(req.user!, ticketId);
    res.json(ticket);
  }),
);

export default router;

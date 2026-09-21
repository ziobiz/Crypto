import { Router } from 'express';
import { createHash } from 'node:crypto';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { hqPolicyService } from '../services/hq-policy.service';
import { AppError } from '../lib/errors';
import { assertCanUseUsdtSimulator } from '../services/simulator-access.service';
import {
  getSimulatorAnalytics,
  listHqSimulatorRuns,
  listMyRecentRuns,
  logSimulatorRun,
  type AnalyticsRange,
  type SimulatorMode,
} from '../services/simulator-log.service';
import {
  buildSimulatorInvoicePayload,
  isInvoiceWebhookConfigured,
  notifyInvoiceTransactionCompleted,
} from '../services/invoice-webhook.service';

const router = Router();
router.use(authenticate);

router.post(
  '/runs',
  asyncHandler(async (req, res) => {
    await assertCanUseUsdtSimulator(req.user!);
    const body = req.body as {
      mode?: string;
      currency?: string;
      network?: string;
      inputAmount?: number;
      requiredFiat?: number;
      netUsdt?: number;
      totalFeeUsdt?: number;
      exchangeRate?: number;
    };
    const mode: SimulatorMode = body.mode === 'target' ? 'target' : 'fiat';
    const network = String(body.network ?? '').trim();
    if (!network) {
      throw new AppError(400, 'Withdrawal network is required', 'NETWORK_REQUIRED');
    }
    const saved = await logSimulatorRun(req.user!, {
      mode,
      currency: String(body.currency ?? 'JPY'),
      network,
      inputAmount: Number(body.inputAmount ?? 0),
      requiredFiat: Number(body.requiredFiat ?? 0),
      netUsdt: Number(body.netUsdt ?? 0),
      totalFeeUsdt: Number(body.totalFeeUsdt ?? 0),
      exchangeRate: Number(body.exchangeRate ?? 0),
    });
    res.json(saved ?? { skipped: true });
  }),
);

/** Issue a [SIMULATOR] invoice from the current simulation result (LIVE/SAND fee tabs alike). */
router.post(
  '/issue-invoice',
  asyncHandler(async (req, res) => {
    await assertCanUseUsdtSimulator(req.user!);
    if (!isInvoiceWebhookConfigured()) {
      throw new AppError(503, 'Invoice webhook is not configured', 'INVOICE_NOT_CONFIGURED');
    }
    const body = req.body as {
      currency?: string;
      network?: string;
      feeMode?: string;
      requiredFiat?: number;
      netUsdt?: number;
      exchangeRate?: number;
      mode?: string;
    };
    const currency = String(body.currency ?? '').trim().toUpperCase();
    const network = String(body.network ?? '').trim();
    const requiredFiat = Number(body.requiredFiat ?? 0);
    const netUsdt = Number(body.netUsdt ?? 0);
    if (!currency || !network || !(requiredFiat > 0) || !(netUsdt > 0)) {
      throw new AppError(400, 'Simulation result is incomplete', 'VALIDATION');
    }

    const runKey = createHash('sha256')
      .update(
        [
          req.user!.id,
          currency,
          network,
          requiredFiat.toFixed(2),
          netUsdt.toFixed(8),
          String(body.feeMode ?? ''),
          String(Date.now()),
        ].join('|'),
      )
      .digest('hex')
      .slice(0, 24);

    const { payload, idempotencyKey } = buildSimulatorInvoicePayload({
      userId: req.user!.id,
      runKey,
      fiatAmount: requiredFiat,
      fiatCurrency: currency,
      assetAmount: netUsdt,
      network,
      feeMode: body.feeMode,
      buyerRef: req.user!.email,
    });

    const result = await notifyInvoiceTransactionCompleted(payload, idempotencyKey);
    if (!result.ok) {
      throw new AppError(
        result.status && result.status >= 400 && result.status < 500 ? result.status : 502,
        result.error || 'Invoice webhook failed',
        'INVOICE_WEBHOOK_FAILED',
      );
    }

    res.status(201).json({
      ok: true,
      kind: 'simulator',
      invoiceNo: result.invoiceNo,
      ticketNo: payload.ticketNo,
      transactionId: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
      assetAmount: payload.assetAmount,
      memo: payload.memo,
      idempotencyKey,
    });
  }),
);

router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    await assertCanUseUsdtSimulator(req.user!);
    res.json(await listMyRecentRuns(req.user!, Number(req.query.limit ?? 2)));
  }),
);

router.get(
  '/hq',
  requireRoles(UserRole.SUPER_ADMIN, UserRole.ORG_STAFF, UserRole.ORGANIZER),
  asyncHandler(async (req, res) => {
    const actor = hqPolicyService.accessActorForUser(req.user!);
    const allowed = await hqPolicyService.canAccessPage(actor, '/dashboard/simulator-logs', 'VIEW');
    if (!allowed) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    const page = Number(req.query.page ?? 1);
    const rawSize = String(req.query.pageSize ?? '100');
    const pageSize = rawSize === 'all' ? 'all' : Number(rawSize);
    res.json(await listHqSimulatorRuns(req.user!, page, pageSize as number | 'all'));
  }),
);

router.get(
  '/hq/analytics',
  requireRoles(UserRole.SUPER_ADMIN, UserRole.ORG_STAFF, UserRole.ORGANIZER),
  asyncHandler(async (req, res) => {
    const actor = hqPolicyService.accessActorForUser(req.user!);
    const allowed = await hqPolicyService.canAccessPage(actor, '/dashboard/simulator-logs', 'VIEW');
    if (!allowed) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    const raw = String(req.query.range ?? 'week');
    const range: AnalyticsRange = raw === 'day' || raw === 'month' ? raw : 'week';
    res.json(await getSimulatorAnalytics(req.user!, range));
  }),
);

export default router;

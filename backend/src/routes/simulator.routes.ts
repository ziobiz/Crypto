import { Router } from 'express';
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

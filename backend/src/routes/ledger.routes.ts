import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { getOrgLedgerSummary } from '../services/commission.service';
import { AppError } from '../lib/errors';

const router = Router();

router.use(authenticate);
router.use(requireRoles(UserRole.SUPER_ADMIN, UserRole.ORG_STAFF));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const orgId = (req.query.organizationId as string) ?? user.organizationId;

    if (!orgId) {
      throw new AppError(400, 'organizationId required', 'VALIDATION_ERROR');
    }

    if (user.role === UserRole.ORG_STAFF && orgId !== user.organizationId) {
      throw new AppError(403, 'Can only view own organization ledger', 'FORBIDDEN');
    }

    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const summary = await getOrgLedgerSummary(orgId, { from, to });
    res.json(summary);
  }),
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { TradeReceiptSendStatus, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { AppError } from '../lib/errors';
import {
  getTradeReceiptEmailLog,
  listTradeReceiptEmailLogs,
} from '../services/trade-email.service';

const router = Router();

router.use(authenticate);
router.use(
  requireRoles(
    UserRole.SUPER_ADMIN,
    UserRole.ORG_STAFF,
    UserRole.ORGANIZER,
    UserRole.SETTLEMENT_ADMIN,
  ),
);

const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(TradeReceiptSendStatus).optional(),
  q: z.string().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listQuery.parse(req.query);
    res.json(await listTradeReceiptEmailLogs(query));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await getTradeReceiptEmailLog(req.params.id);
    if (!row) throw new AppError(404, 'Receipt email log not found', 'NOT_FOUND');
    res.json(row);
  }),
);

export default router;

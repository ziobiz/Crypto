import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { requireSensitiveOtp } from '../middleware/sensitiveOtp';
import * as merchantOperatorService from '../services/merchant-operator.service';
import * as merchantOpLogService from '../services/merchant-operation-log.service';

const router = Router();

router.use(authenticate);

router.get(
  '/operators',
  requireRoles(UserRole.CUSTOMER),
  asyncHandler(async (req, res) => {
    res.json(await merchantOperatorService.listMerchantOperators(req.user!));
  }),
);

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
});

router.post(
  '/operators',
  requireRoles(UserRole.CUSTOMER),
  requireSensitiveOtp,
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const result = await merchantOperatorService.createMerchantOperator(req.user!, body, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    res.status(201).json(result);
  }),
);

router.patch(
  '/operators/:id/deactivate',
  requireRoles(UserRole.CUSTOMER),
  requireSensitiveOtp,
  asyncHandler(async (req, res) => {
    const result = await merchantOperatorService.deactivateMerchantOperator(
      req.user!,
      req.params.id,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
      },
    );
    res.json(result);
  }),
);

router.patch(
  '/operators/:id/activate',
  requireRoles(UserRole.CUSTOMER),
  requireSensitiveOtp,
  asyncHandler(async (req, res) => {
    const result = await merchantOperatorService.activateMerchantOperator(
      req.user!,
      req.params.id,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
      },
    );
    res.json(result);
  }),
);

router.get(
  '/operation-logs',
  requireRoles(UserRole.CUSTOMER, UserRole.CUSTOMER_OPERATOR, UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 50);
    res.json(await merchantOpLogService.listMerchantOperationLogs(req.user!, { page, pageSize }));
  }),
);

router.delete(
  '/operation-logs/:id',
  requireRoles(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    res.json(await merchantOpLogService.deleteMerchantOperationLog(req.user!, req.params.id));
  }),
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { CustomerType, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { auditFromRequest } from '../services/admin-change-log.service';
import { userService } from '../services/user.service';

const router = Router();

router.use(authenticate, requireRoles('SUPER_ADMIN', 'ORG_STAFF'));

const listQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  organizationId: z.string().optional(),
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  organizationId: z.string().optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
  recruitingOrgId: z.string().optional(),
  businessName: z.string().optional(),
  businessNumber: z.string().optional(),
  bankName: z.string().min(1).optional(),
  accountNumber: z.string().min(1).optional(),
  accountHolder: z.string().min(1).optional(),
  walletAddress: z.string().min(10).optional(),
  walletNetwork: z.string().optional(),
  walletLabel: z.string().optional(),
  reason: z.string().min(1, '등록 사유가 필요합니다'),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole).optional(),
  organizationId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  recruitingOrgId: z.string().optional(),
  statusReason: z.string().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(6).optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    res.json(await userService.list(req.user!, query));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await userService.getById(req.user!, req.params.id));
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const audit = auditFromRequest(req.user!, req);
    const user = await userService.create(req.user!, body, audit);
    res.status(201).json(user);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = updateSchema.parse(req.body);
    const audit = auditFromRequest(req.user!, req);
    res.json(await userService.update(req.user!, req.params.id, body, audit));
  }),
);

router.patch(
  '/:id/password',
  asyncHandler(async (req, res) => {
    const { password } = passwordSchema.parse(req.body);
    const audit = auditFromRequest(req.user!, req);
    res.json(await userService.resetPassword(req.user!, req.params.id, password, audit));
  }),
);

router.patch(
  '/:id/otp',
  asyncHandler(async (req, res) => {
    const audit = auditFromRequest(req.user!, req);
    res.json(await userService.resetOtp(req.user!, req.params.id, audit));
  }),
);

export default router;

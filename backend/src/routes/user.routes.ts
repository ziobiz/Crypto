import { Router } from 'express';
import { z } from 'zod';
import { CustomerType, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { auditFromRequest } from '../services/admin-change-log.service';
import { userService } from '../services/user.service';

const router = Router();

router.use(authenticate, requireRoles('SUPER_ADMIN', 'ORG_STAFF', 'ORGANIZER', 'SETTLEMENT_ADMIN'));

const listQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  organizationId: z.string().optional(),
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  staffOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  kycStatus: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

function emptyToUndef(value: unknown) {
  if (value === '' || value === null) return undefined;
  return value;
}

const optionalNonEmpty = z.preprocess(emptyToUndef, z.string().min(1).optional());

const createSchema = z.object({
  email: z.string().email(),
  password: z.preprocess(emptyToUndef, z.string().min(6).optional()),
  name: z.string().min(1),
  phone: z.preprocess(emptyToUndef, z.string().optional()),
  role: z.nativeEnum(UserRole),
  organizationId: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  customerType: z.nativeEnum(CustomerType).optional(),
  recruitingOrgId: z.preprocess(emptyToUndef, z.string().optional()),
  businessName: z.preprocess(emptyToUndef, z.string().optional()),
  businessNumber: z.preprocess(emptyToUndef, z.string().optional()),
  bankName: optionalNonEmpty,
  accountNumber: optionalNonEmpty,
  accountHolder: optionalNonEmpty,
  walletAddress: z.preprocess(emptyToUndef, z.string().min(10).optional()),
  walletNetwork: z.preprocess(emptyToUndef, z.string().optional()),
  walletLabel: z.preprocess(emptyToUndef, z.string().optional()),
  reason: z.string().min(1, '등록 사유가 필요합니다'),
  feeShare: z.unknown().optional(),
  usdtFeeTypeCode: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  tradeFeeTypeCode: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  simulatorEnabled: z.boolean().optional(),
  simulatorRateMode: z.enum(['LIVE', 'SAND']).optional(),
  feeBillingMethod: z.enum(['FOLLOW_HQ', 'INTEGRATED', 'ITEMIZED', 'HYBRID']).optional(),
  usdtCollectionMode: z.enum(['FOLLOW_HQ', 'FIXED', 'VIRTUAL']).optional(),
  operatorsEnabled: z.boolean().optional(),
  walletFeesVisible: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole).optional(),
  organizationId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  recruitingOrgId: z.string().optional(),
  statusReason: z.string().optional(),
  feeShare: z.unknown().optional(),
  simulatorEnabled: z.boolean().optional(),
  simulatorRateMode: z.enum(['LIVE', 'SAND']).optional(),
  feeBillingMethod: z.enum(['FOLLOW_HQ', 'INTEGRATED', 'ITEMIZED', 'HYBRID']).optional(),
  usdtCollectionMode: z.enum(['FOLLOW_HQ', 'FIXED', 'VIRTUAL']).optional(),
  operatorsEnabled: z.boolean().optional(),
  walletFeesVisible: z.boolean().optional(),
});

const walletApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
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
  '/:id/wallets/:walletId/approval',
  asyncHandler(async (req, res) => {
    const body = walletApprovalSchema.parse(req.body);
    const audit = auditFromRequest(req.user!, req);
    res.json(
      await userService.reviewWallet(
        req.user!,
        req.params.id,
        req.params.walletId,
        body.status,
        audit,
      ),
    );
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

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const audit = auditFromRequest(req.user!, req);
    res.json(await userService.softDelete(req.user!, req.params.id, audit));
  }),
);

export default router;

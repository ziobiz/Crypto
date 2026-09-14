import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { KycStatus, UserRole } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { MERCHANT_TRADE_ROLES } from '../lib/merchant-role';
import { AppError } from '../lib/errors';
import {
  getKycAttachmentForDownload,
  getKycByUserId,
  getKycCase,
  getMyKyc,
  listKycCases,
  reviewKyc,
  reviewKycByUserId,
  submitMyKyc,
} from '../services/kyc.service';

const router = Router();

const APPLICATION_DOC_EXTS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.xlsx', '.xls']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    if (APPLICATION_DOC_EXTS.has(ext) || file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF, Excel, or image required'));
    }
  },
});

router.use(authenticate);

router.get(
  '/me',
  requireRoles(...MERCHANT_TRADE_ROLES),
  asyncHandler(async (req, res) => {
    res.json(await getMyKyc(req.user!));
  }),
);

router.post(
  '/me',
  requireRoles(UserRole.CUSTOMER),
  upload.fields([
    { name: 'forecast', maxCount: 5 },
    { name: 'taxSupport', maxCount: 10 },
  ]),
  asyncHandler(async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    res.json(
      await submitMyKyc(req.user!, {
        forecast: files?.forecast ?? [],
        taxSupport: files?.taxSupport ?? [],
      }),
    );
  }),
);

router.get(
  '/cases',
  requireRoles(UserRole.SUPER_ADMIN, UserRole.ORG_STAFF, UserRole.ORGANIZER),
  asyncHandler(async (req, res) => {
    const raw = String(req.query.status ?? '');
    const status = (Object.values(KycStatus) as string[]).includes(raw) ? (raw as KycStatus) : undefined;
    res.json(await listKycCases(status));
  }),
);

router.get(
  '/users/:userId',
  requireRoles(UserRole.SUPER_ADMIN, UserRole.ORG_STAFF, UserRole.ORGANIZER),
  asyncHandler(async (req, res) => {
    res.json(await getKycByUserId(req.params.userId));
  }),
);

router.post(
  '/users/:userId/review',
  requireRoles(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const action = req.body?.action === 'REJECT' ? 'REJECT' : req.body?.action === 'APPROVE' ? 'APPROVE' : null;
    if (!action) {
      throw new AppError(400, 'action APPROVE or REJECT required', 'VALIDATION_ERROR');
    }
    res.json(
      await reviewKycByUserId(
        req.user!,
        req.params.userId,
        action,
        typeof req.body?.reason === 'string' ? req.body.reason : undefined,
        typeof req.body?.hqNote === 'string' ? req.body.hqNote : undefined,
      ),
    );
  }),
);

router.get(
  '/cases/:id',
  requireRoles(UserRole.SUPER_ADMIN, UserRole.ORG_STAFF, UserRole.ORGANIZER),
  asyncHandler(async (req, res) => {
    res.json(await getKycCase(req.params.id));
  }),
);

router.post(
  '/cases/:id/review',
  requireRoles(UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const action = req.body?.action === 'REJECT' ? 'REJECT' : req.body?.action === 'APPROVE' ? 'APPROVE' : null;
    if (!action) {
      throw new AppError(400, 'action APPROVE or REJECT required', 'VALIDATION_ERROR');
    }
    res.json(
      await reviewKyc(
        req.user!,
        req.params.id,
        action,
        typeof req.body?.reason === 'string' ? req.body.reason : undefined,
        typeof req.body?.hqNote === 'string' ? req.body.hqNote : undefined,
      ),
    );
  }),
);

router.get(
  '/attachments/:id/file',
  asyncHandler(async (req, res) => {
    const file = await getKycAttachmentForDownload(req.user!, req.params.id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    res.sendFile(path.resolve(file.path));
  }),
);

export default router;

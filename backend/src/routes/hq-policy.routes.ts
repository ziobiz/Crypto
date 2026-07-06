import { Router } from 'express';
import multer from 'multer';
import { TicketType } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { hqPolicyService } from '../services/hq-policy.service';
import type { HqAccessMatrix, HqCommissionRiskConfig, HqOrgColumnConfig, HqPlatformConfig, HqEmailOtpConfig } from '../constants/hq-policy';

const router = Router();
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(authenticate, requireRoles('SUPER_ADMIN'));

router.get(
  '/access',
  asyncHandler(async (_req, res) => {
    res.json(await hqPolicyService.getAccessPayload());
  }),
);

router.put(
  '/access',
  asyncHandler(async (req, res) => {
    const body = req.body as { matrix?: HqAccessMatrix };
    if (!body.matrix) {
      res.status(400).json({ error: 'matrix required' });
      return;
    }
    res.json(await hqPolicyService.saveAccessMatrix(body.matrix));
  }),
);

router.get(
  '/org-columns',
  asyncHandler(async (_req, res) => {
    res.json(await hqPolicyService.getOrgColumnsPayload());
  }),
);

router.put(
  '/org-columns',
  asyncHandler(async (req, res) => {
    const body = req.body as { config?: HqOrgColumnConfig };
    if (!body.config) {
      res.status(400).json({ error: 'config required' });
      return;
    }
    res.json(await hqPolicyService.saveOrgColumns(body.config));
  }),
);

router.get(
  '/commission',
  asyncHandler(async (_req, res) => {
    res.json(await hqPolicyService.getCommissionPayload());
  }),
);

router.put(
  '/commission/risk',
  asyncHandler(async (req, res) => {
    const body = req.body as { risk?: HqCommissionRiskConfig };
    if (!body.risk) {
      res.status(400).json({ error: 'risk required' });
      return;
    }
    res.json(await hqPolicyService.saveCommissionRisk(body.risk));
  }),
);

router.put(
  '/commission/rates',
  asyncHandler(async (req, res) => {
    const body = req.body as {
      rates?: Array<{ organizationId: string; ticketType: TicketType; ratePercent: number }>;
    };
    if (!body.rates?.length) {
      res.status(400).json({ error: 'rates required' });
      return;
    }
    try {
      res.json(await hqPolicyService.saveCommissionRates(body.rates));
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'save failed' });
    }
  }),
);

router.get(
  '/platform',
  asyncHandler(async (_req, res) => {
    res.json(await hqPolicyService.getPlatformPayload());
  }),
);

router.put(
  '/platform',
  asyncHandler(async (req, res) => {
    const body = req.body as { config?: HqPlatformConfig };
    if (!body.config) {
      res.status(400).json({ error: 'config required' });
      return;
    }
    res.json(await hqPolicyService.savePlatform(body.config));
  }),
);

router.put(
  '/platform/email',
  asyncHandler(async (req, res) => {
    const body = req.body as { email?: HqEmailOtpConfig };
    if (!body.email) {
      res.status(400).json({ error: 'email required' });
      return;
    }
    res.json(await hqPolicyService.savePlatformEmail(body.email));
  }),
);

router.post(
  '/platform/email/test',
  asyncHandler(async (req, res) => {
    const body = req.body as { to?: string };
    if (!body.to) {
      res.status(400).json({ error: 'to required' });
      return;
    }
    res.json(await hqPolicyService.sendPlatformEmailTest(body.to));
  }),
);

router.post(
  '/platform/logo',
  logoUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'file required' });
      return;
    }
    res.json(await hqPolicyService.savePlatformLogo(req.file));
  }),
);

router.post(
  '/platform/auth-logo',
  logoUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'file required' });
      return;
    }
    res.json(await hqPolicyService.savePlatformAuthLogo(req.file));
  }),
);

router.post(
  '/platform/favicon',
  logoUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'file required' });
      return;
    }
    res.json(await hqPolicyService.savePlatformFavicon(req.file));
  }),
);

router.post(
  '/platform/background',
  logoUpload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'file required' });
      return;
    }
    res.json(await hqPolicyService.savePlatformBackground(req.file));
  }),
);

export default router;

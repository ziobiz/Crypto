import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { TicketType } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { auditFromRequest, listAdminChangeLogs } from '../services/admin-change-log.service';
import { hqPolicyService } from '../services/hq-policy.service';
import { createPlatformRelease, listPlatformReleases } from '../services/platform-release.service';
import type { HqAccessMatrix, HqCommissionRiskConfig, HqExchangeRateSourcePolicy, HqOrgColumnConfig, HqPlatformConfig, HqEmailOtpConfig, SymbolFeeTierPolicy } from '../constants/hq-policy';

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
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveAccessMatrix(audit, body.matrix));
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
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveOrgColumns(audit, body.config));
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
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveCommissionRisk(audit, body.risk));
  }),
);

router.put(
  '/commission/fee-tiers',
  asyncHandler(async (req, res) => {
    const body = req.body as { feeTiers?: SymbolFeeTierPolicy };
    if (!body.feeTiers?.length) {
      res.status(400).json({ error: 'feeTiers required' });
      return;
    }
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveSymbolFeeTiers(audit, body.feeTiers));
  }),
);

router.put(
  '/commission/exchange-rate-sources',
  asyncHandler(async (req, res) => {
    const body = req.body as { exchangeRateSources?: HqExchangeRateSourcePolicy };
    if (!body.exchangeRateSources) {
      res.status(400).json({ error: 'exchangeRateSources required' });
      return;
    }
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveExchangeRateSources(audit, body.exchangeRateSources));
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
      const audit = auditFromRequest(req.user!, req);
      res.json(await hqPolicyService.saveCommissionRates(audit, body.rates));
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
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.savePlatform(audit, body.config));
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
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.savePlatformEmail(audit, body.email));
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
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.savePlatformLogo(audit, req.file));
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
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.savePlatformAuthLogo(audit, req.file));
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
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.savePlatformFavicon(audit, req.file));
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
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.savePlatformBackground(audit, req.file));
  }),
);

const changeLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  entityType: z.string().optional(),
  changedById: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const releaseLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  locale: z.enum(['KR', 'US', 'JP', 'CH', 'TH']).optional(),
});

const createReleaseSchema = z.object({
  version: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  packageSizeMb: z.number().optional(),
  status: z.string().optional(),
  deployedAt: z.string().optional(),
  notes: z.string().optional(),
  changeLevel: z.enum(['MAJOR', 'MINOR', 'PATCH']).optional(),
});

router.get(
  '/ops/change-logs',
  asyncHandler(async (req, res) => {
    const query = changeLogQuerySchema.parse(req.query);
    res.json(await listAdminChangeLogs(query));
  }),
);

router.get(
  '/ops/release-logs',
  asyncHandler(async (req, res) => {
    const query = releaseLogQuerySchema.parse(req.query);
    res.json(await listPlatformReleases(query));
  }),
);

router.post(
  '/ops/release-logs',
  asyncHandler(async (req, res) => {
    const body = createReleaseSchema.parse(req.body);
    res.status(201).json(await createPlatformRelease(req.user!, body));
  }),
);

export default router;

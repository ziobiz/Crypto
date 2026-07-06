import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { hqPolicyService } from '../services/hq-policy.service';
import type { HqAccessMatrix, HqCommissionRiskConfig, HqOrgColumnConfig, HqPlatformConfig } from '../constants/hq-policy';

const router = Router();

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

export default router;

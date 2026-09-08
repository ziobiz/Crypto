import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AdminChangeAction, TicketType } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { auditFromRequest, listAdminChangeLogs, logAdminChange } from '../services/admin-change-log.service';
import { hqPolicyService } from '../services/hq-policy.service';
import { createPlatformRelease, listPlatformReleases } from '../services/platform-release.service';
import type { HqAccessMatrix, HqCommissionRiskConfig, HqExchangeRateSourcePolicy, HqOrgColumnConfig, HqPlatformConfig, HqEmailOtpConfig, HqCardPaymentConfig, HqIcopayConfig, HqCurfexConfig, SymbolFeeTierPolicy, HqDeletionPolicy, HqOrgSharePolicy, HqWorkflowDisplayConfig, HqGasNetworkPolicy } from '../constants/hq-policy';
import {
  getDeletionPolicy,
  hardDeleteOrganization,
  hardDeleteUser,
  saveDeletionPolicy,
} from '../services/deletion.service';
import { organizationService } from '../services/organization.service';
import { userService } from '../services/user.service';
import {
  getCardPaymentConfig,
  getIcopayConfigMasked,
  saveCardPaymentConfig,
  saveIcopayConfig,
} from '../services/card-payment-policy.service';
import {
  getCurfexConfigMasked,
  saveCurfexConfig,
  generateCurfexWebhookSecret,
  publicCurfexWebhookUrl,
} from '../services/curfex.service';

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
  '/commission/gas-networks',
  asyncHandler(async (req, res) => {
    const body = req.body as { gasNetworks?: HqGasNetworkPolicy };
    if (!body.gasNetworks) {
      res.status(400).json({ error: 'gasNetworks required' });
      return;
    }
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveGasNetworks(audit, body.gasNetworks));
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
  '/commission/simulator/risk',
  asyncHandler(async (req, res) => {
    const body = req.body as { risk?: HqCommissionRiskConfig };
    if (!body.risk) {
      res.status(400).json({ error: 'risk required' });
      return;
    }
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveSimulatorCommissionRisk(audit, body.risk));
  }),
);

router.put(
  '/commission/simulator/fee-tiers',
  asyncHandler(async (req, res) => {
    const body = req.body as { feeTiers?: SymbolFeeTierPolicy };
    if (!body.feeTiers?.length) {
      res.status(400).json({ error: 'feeTiers required' });
      return;
    }
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveSimulatorSymbolFeeTiers(audit, body.feeTiers));
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
  '/commission/org-share',
  asyncHandler(async (req, res) => {
    const body = req.body as { orgShare?: HqOrgSharePolicy };
    if (!body.orgShare) {
      res.status(400).json({ error: 'orgShare required' });
      return;
    }
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveOrgSharePolicy(audit, body.orgShare));
  }),
);

router.get(
  '/commission/fee-types',
  asyncHandler(async (_req, res) => {
    const { customerFeePolicyService } = await import('../services/customer-fee-policy.service');
    res.json({ feeTypes: await customerFeePolicyService.listFeeTypes() });
  }),
);

router.post(
  '/commission/fee-types',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        code: z.string().min(1),
        name: z.string().min(1),
        ticketKind: z.enum(['USDT_PURCHASE', 'TRADE_ESCROW']),
        config: z.unknown().optional(),
        isDefault: z.boolean().optional(),
      })
      .parse(req.body);
    const { customerFeePolicyService } = await import('../services/customer-fee-policy.service');
    await customerFeePolicyService.createFeeType({
      code: body.code,
      name: body.name,
      ticketKind: body.ticketKind,
      config: body.config as HqOrgSharePolicy | undefined,
      isDefault: body.isDefault,
    });
    res.json(await hqPolicyService.getCommissionPayload());
  }),
);

router.put(
  '/commission/fee-types/:id',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().optional(),
        config: z.unknown().optional(),
        isDefault: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })
      .parse(req.body);
    const { customerFeePolicyService } = await import('../services/customer-fee-policy.service');
    await customerFeePolicyService.updateFeeType(req.params.id, {
      name: body.name,
      config: body.config as HqOrgSharePolicy | undefined,
      isDefault: body.isDefault,
      sortOrder: body.sortOrder,
    });
    res.json(await hqPolicyService.getCommissionPayload());
  }),
);

router.delete(
  '/commission/fee-types/:id',
  asyncHandler(async (req, res) => {
    const { customerFeePolicyService } = await import('../services/customer-fee-policy.service');
    await customerFeePolicyService.deleteFeeType(req.params.id);
    res.json(await hqPolicyService.getCommissionPayload());
  }),
);

router.put(
  '/commission/rates',
  asyncHandler(async (req, res) => {
    const body = req.body as {
      rates?: Array<{
        organizationId: string;
        ticketType: TicketType;
        ratePercent: number;
        perTicketUsdt?: number;
        useDefault?: boolean;
      }>;
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

router.get(
  '/payment/card',
  asyncHandler(async (_req, res) => {
    res.json({ config: await getCardPaymentConfig() });
  }),
);

router.put(
  '/payment/card',
  asyncHandler(async (req, res) => {
    const body = req.body as { config?: HqCardPaymentConfig };
    if (!body.config) {
      res.status(400).json({ error: 'config required' });
      return;
    }
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveCardPayment(audit, body.config));
  }),
);

router.get(
  '/payment/icopay',
  asyncHandler(async (_req, res) => {
    res.json({ config: await getIcopayConfigMasked() });
  }),
);

router.put(
  '/payment/icopay',
  asyncHandler(async (req, res) => {
    const body = req.body as { config?: HqIcopayConfig };
    if (!body.config) {
      res.status(400).json({ error: 'config required' });
      return;
    }
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveIcopay(audit, body.config));
  }),
);

router.get(
  '/payment/curfex',
  asyncHandler(async (_req, res) => {
    res.json({
      config: await getCurfexConfigMasked(),
      webhookUrl: publicCurfexWebhookUrl(),
    });
  }),
);

router.put(
  '/payment/curfex',
  asyncHandler(async (req, res) => {
    const body = req.body as { config?: HqCurfexConfig };
    if (!body.config) {
      res.status(400).json({ error: 'config required' });
      return;
    }
    const audit = auditFromRequest(req.user!, req);
    const result = await hqPolicyService.saveCurfex(audit, body.config);
    res.json({ ...result, webhookUrl: publicCurfexWebhookUrl() });
  }),
);

router.post(
  '/payment/curfex/webhook-secret',
  asyncHandler(async (req, res) => {
    const audit = auditFromRequest(req.user!, req);
    const before = await getCurfexConfigMasked();
    const after = await generateCurfexWebhookSecret();
    await logAdminChange({
      actor: audit.actor,
      action: AdminChangeAction.UPDATE,
      entityType: 'HQ_CURFEX',
      entityId: 'hq.payment.curfex',
      entityLabel: 'CURFEX webhook secret',
      summary: `CURFEX 웹훅 HMAC 비밀 재생성 (관리자: ${audit.actor.email})`,
      before,
      after,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
    // Return unmasked secret once so HQ can copy into CURFEX portal
    const { getCurfexConfig } = await import('../services/curfex.service');
    const full = await getCurfexConfig();
    res.json({
      config: after,
      webhookUrl: publicCurfexWebhookUrl(),
      webhookSecretOnce: full.webhookSecret,
    });
  }),
);

router.get(
  '/deletion',
  asyncHandler(async (_req, res) => {
    const [policy, users, orgs] = await Promise.all([
      getDeletionPolicy(),
      userService.listDeleted(),
      organizationService.listDeleted(),
    ]);
    res.json({ policy, users, orgs });
  }),
);

router.put(
  '/deletion',
  asyncHandler(async (req, res) => {
    const body = req.body as { policy?: HqDeletionPolicy };
    if (!body.policy) {
      res.status(400).json({ error: 'policy required' });
      return;
    }
    const before = await getDeletionPolicy();
    const after = await saveDeletionPolicy(body.policy);
    const audit = auditFromRequest(req.user!, req);
    await logAdminChange({
      actor: audit.actor,
      action: AdminChangeAction.UPDATE,
      entityType: 'HQ_DELETION_POLICY',
      entityId: 'hq.deletion.policy',
      entityLabel: '삭제관리',
      summary: `삭제 자동 보관기간 저장 사용자 ${after.userRetentionMonths}개월 / 조직 ${after.orgRetentionMonths}개월 (관리자: ${audit.actor.email})`,
      before,
      after,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
    const [users, orgs] = await Promise.all([userService.listDeleted(), organizationService.listDeleted()]);
    res.json({ policy: after, users, orgs });
  }),
);

router.delete(
  '/deletion/users/:id',
  asyncHandler(async (req, res) => {
    await hardDeleteUser(req.params.id);
    res.json({ ok: true });
  }),
);

router.post(
  '/deletion/users/:id/restore',
  asyncHandler(async (req, res) => {
    const audit = auditFromRequest(req.user!, req);
    await userService.restoreDeleted(req.user!, req.params.id, audit);
    res.json({ ok: true });
  }),
);

router.delete(
  '/deletion/orgs/:id',
  asyncHandler(async (req, res) => {
    await hardDeleteOrganization(req.params.id);
    res.json({ ok: true });
  }),
);

router.get(
  '/workflow-display',
  asyncHandler(async (_req, res) => {
    res.json(await hqPolicyService.getWorkflowDisplay());
  }),
);

router.put(
  '/workflow-display',
  asyncHandler(async (req, res) => {
    const body = req.body as { config?: HqWorkflowDisplayConfig };
    if (!body.config) {
      res.status(400).json({ error: 'config required' });
      return;
    }
    const audit = auditFromRequest(req.user!, req);
    res.json(await hqPolicyService.saveWorkflowDisplay(audit, body.config));
  }),
);

export default router;

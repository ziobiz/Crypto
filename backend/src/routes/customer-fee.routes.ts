import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import {
  createFeeTypeTemplate,
  deleteCustomerFeePolicy,
  deleteFeeTypeTemplate,
  listCustomerFeeGrid,
  listCustomerFeeHistory,
  listFeeTypeTemplates,
  saveCustomerFeePolicy,
  updateFeeTypeTemplate,
  type FeeTicketKind,
} from '../services/customer-fee-policy.service';
import type { HqOrgShareByType, HqOrgSharePolicy } from '../constants/hq-policy';

const router = Router();

router.use(authenticate, requireRoles('SUPER_ADMIN', 'ORG_STAFF', 'ORGANIZER'));

function parseTicketKind(raw: unknown): FeeTicketKind {
  return raw === 'TRADE_ESCROW' ? 'TRADE_ESCROW' : 'USDT_PURCHASE';
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ticketKind = parseTicketKind(req.query.ticketKind);
    res.json(await listCustomerFeeGrid(ticketKind));
  }),
);

router.get(
  '/types',
  asyncHandler(async (_req, res) => {
    res.json({ feeTypes: await listFeeTypeTemplates() });
  }),
);

router.post(
  '/types',
  requireRoles('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      code?: string;
      name?: string;
      config?: HqOrgSharePolicy;
      isDefault?: boolean;
      sortOrder?: number;
    };
    if (!body.code || !body.name) {
      res.status(400).json({ error: 'code and name required' });
      return;
    }
    res.json(await createFeeTypeTemplate(body as { code: string; name: string; config?: HqOrgSharePolicy; isDefault?: boolean; sortOrder?: number }));
  }),
);

router.put(
  '/types/:id',
  requireRoles('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      name?: string;
      config?: HqOrgSharePolicy;
      isDefault?: boolean;
      sortOrder?: number;
    };
    res.json(await updateFeeTypeTemplate(req.params.id, body));
  }),
);

router.delete(
  '/types/:id',
  requireRoles('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    res.json(await deleteFeeTypeTemplate(req.params.id));
  }),
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const customerProfileId = String(req.query.customerProfileId || '');
    if (!customerProfileId) {
      res.status(400).json({ error: 'customerProfileId required' });
      return;
    }
    const ticketKind = req.query.ticketKind
      ? parseTicketKind(req.query.ticketKind)
      : undefined;
    res.json({
      rows: await listCustomerFeeHistory({
        customerProfileId,
        ticketKind,
        limit: Number(req.query.limit) || 200,
      }),
    });
  }),
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body as {
      customerProfileId?: string;
      ticketKind?: string;
      feeTypeCode?: string;
      operatingPercent?: number;
      operatingFixedUsdt?: number;
      shares?: HqOrgShareByType;
      applyStartDate?: string;
      forceManual?: boolean;
    };
    if (!body.customerProfileId || !body.applyStartDate) {
      res.status(400).json({ error: 'customerProfileId and applyStartDate required' });
      return;
    }
    const saved = await saveCustomerFeePolicy({
      customerProfileId: body.customerProfileId,
      ticketKind: parseTicketKind(body.ticketKind),
      feeTypeCode: body.feeTypeCode,
      operatingPercent: body.operatingPercent,
      operatingFixedUsdt: body.operatingFixedUsdt,
      shares: body.shares,
      applyStartDate: body.applyStartDate,
      forceManual: body.forceManual,
      changedByUserId: req.user!.id,
    });
    res.json({ ok: true, policy: saved });
  }),
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body as {
      customerProfileId?: string;
      ticketKind?: string;
      policyId?: string;
    };
    if (!body.customerProfileId) {
      res.status(400).json({ error: 'customerProfileId required' });
      return;
    }
    res.json(
      await deleteCustomerFeePolicy({
        customerProfileId: body.customerProfileId,
        ticketKind: parseTicketKind(body.ticketKind),
        policyId: body.policyId,
        changedByUserId: req.user!.id,
      }),
    );
  }),
);

export default router;

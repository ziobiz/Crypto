import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import {
  customerFeePolicyService,
  type FeeTicketKind,
} from '../services/customer-fee-policy.service';
import { HQ_ORG_LEVELS, type HqOrgShareByType } from '../constants/hq-policy';

const router = Router();

const ticketKindSchema = z.enum(['USDT_PURCHASE', 'TRADE_ESCROW']);

const sharesSchema = z.record(
  z.object({
    poolPercent: z.number(),
    perTicketUsdt: z.number(),
  }),
);

function normalizeShares(raw: unknown): HqOrgShareByType | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const src = raw as Record<string, { poolPercent?: number; perTicketUsdt?: number }>;
  const out = {} as HqOrgShareByType;
  for (const level of HQ_ORG_LEVELS) {
    out[level] = {
      poolPercent: Number(src[level]?.poolPercent) || 0,
      perTicketUsdt: Number(src[level]?.perTicketUsdt) || 0,
    };
  }
  return out;
}

router.use(authenticate, requireRoles('SUPER_ADMIN', 'ORG_STAFF', 'ORGANIZER'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const ticketKind = ticketKindSchema.parse(req.query.ticketKind ?? 'USDT_PURCHASE');
    res.json(await customerFeePolicyService.listGrid(ticketKind as FeeTicketKind));
  }),
);

router.get(
  '/fee-types',
  asyncHandler(async (_req, res) => {
    res.json({ feeTypes: await customerFeePolicyService.listFeeTypes() });
  }),
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const customerProfileId = z.string().min(1).parse(req.query.customerProfileId);
    const ticketKind = ticketKindSchema.parse(req.query.ticketKind ?? 'USDT_PURCHASE');
    res.json({
      rows: await customerFeePolicyService.listHistory(customerProfileId, ticketKind as FeeTicketKind),
    });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        customerProfileId: z.string().min(1),
        ticketKind: ticketKindSchema,
        feeTypeCode: z.string().optional(),
        operatingPercent: z.number().optional(),
        operatingFixedUsdt: z.number().optional(),
        shares: sharesSchema.optional(),
        applyStartDate: z.string().min(8),
        assignTypeOnly: z.boolean().optional(),
      })
      .parse(req.body);

    const saved = await customerFeePolicyService.savePolicy({
      customerProfileId: body.customerProfileId,
      ticketKind: body.ticketKind as FeeTicketKind,
      feeTypeCode: body.feeTypeCode,
      operatingPercent: body.operatingPercent,
      operatingFixedUsdt: body.operatingFixedUsdt,
      shares: normalizeShares(body.shares),
      applyStartDate: body.applyStartDate,
      assignTypeOnly: body.assignTypeOnly,
      changedByUserId: req.user!.id,
    });
    res.json(saved);
  }),
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        customerProfileId: z.string().min(1),
        ticketKind: ticketKindSchema,
        policyId: z.string().optional(),
      })
      .parse(req.body);
    res.json(
      await customerFeePolicyService.deletePolicy({
        ...body,
        ticketKind: body.ticketKind as FeeTicketKind,
        changedByUserId: req.user!.id,
      }),
    );
  }),
);

export default router;

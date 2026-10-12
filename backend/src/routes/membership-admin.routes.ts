import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import {
  adminCancelMembershipOrder,
  adminRefundMembershipOrder,
  getMembershipOrderAdmin,
  getPaidMembershipRefundPolicy,
  listMembershipOrdersAdmin,
  savePaidMembershipRefundPolicy,
} from '../services/membership-admin.service';
import { quoteMembershipPrice } from '../services/membership-price.service';
import type { MembershipPriceCurrency } from '../constants/hq-policy';
import { isMembershipPriceCurrency } from '../constants/hq-policy';

const router = Router();

router.use(authenticate, requireRoles('SUPER_ADMIN'));

router.get(
  '/price-quote',
  asyncHandler(async (req, res) => {
    const priceUsd = Number(req.query.priceUsd ?? 0);
    const currencyRaw = String(req.query.currency ?? 'USD').toUpperCase();
    const currency: MembershipPriceCurrency = isMembershipPriceCurrency(currencyRaw)
      ? currencyRaw
      : 'USD';
    res.json(await quoteMembershipPrice(priceUsd, currency));
  }),
);

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const q = req.query;
    res.json(
      await listMembershipOrdersAdmin({
        page: q.page ? Number(q.page) : 1,
        limit: q.limit ? Number(q.limit) : 20,
        dateField: q.dateField === 'paidAt' ? 'paidAt' : 'createdAt',
        dateFrom: typeof q.dateFrom === 'string' ? q.dateFrom : undefined,
        dateTo: typeof q.dateTo === 'string' ? q.dateTo : undefined,
        status: typeof q.status === 'string' ? q.status : undefined,
        payMeans: typeof q.payMeans === 'string' ? q.payMeans : undefined,
        cryptoAsset: typeof q.cryptoAsset === 'string' ? q.cryptoAsset : undefined,
        searchField: typeof q.searchField === 'string' ? q.searchField : undefined,
        keyword: typeof q.keyword === 'string' ? q.keyword : undefined,
        sortDir: q.sortDir === 'asc' ? 'asc' : 'desc',
      }),
    );
  }),
);

router.get(
  '/orders/:orderNo',
  asyncHandler(async (req, res) => {
    res.json(await getMembershipOrderAdmin(req.params.orderNo));
  }),
);

router.get(
  '/refund-policy',
  asyncHandler(async (_req, res) => {
    res.json({ policy: await getPaidMembershipRefundPolicy() });
  }),
);

router.put(
  '/refund-policy',
  asyncHandler(async (req, res) => {
    const body = z
      .object({ adminCancelRefundEnabled: z.boolean() })
      .parse(req.body ?? {});
    res.json({ policy: await savePaidMembershipRefundPolicy(body) });
  }),
);

router.post(
  '/orders/:orderNo/cancel',
  asyncHandler(async (req, res) => {
    const body = z.object({ note: z.string().max(500).optional() }).parse(req.body ?? {});
    const order = await adminCancelMembershipOrder({
      orderNo: req.params.orderNo,
      note: body.note,
    });
    res.json({ order });
  }),
);

router.post(
  '/orders/:orderNo/refund',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        note: z.string().max(500).optional(),
        revokeBenefits: z.boolean().optional(),
      })
      .parse(req.body ?? {});
    res.json(
      await adminRefundMembershipOrder({
        orderNo: req.params.orderNo,
        note: body.note,
        revokeBenefits: body.revokeBenefits,
      }),
    );
  }),
);

export default router;

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { requireCostAnalysisRole, requireSensitiveOtp } from '../middleware/sensitiveOtp';
import { createCostAnalysis, listCostAnalyses, previewCostAnalysis } from '../services/cost-analysis.service';
import { listProfitAnalysis, setBrokerUsdt } from '../services/profit-analysis.service';

const router = Router();
router.use(authenticate);
router.use(requireCostAnalysisRole);
router.use(requireSensitiveOtp);

router.get(
  '/cost',
  asyncHandler(async (_req, res) => {
    res.json(await listCostAnalyses());
  }),
);

router.post(
  '/cost/preview',
  asyncHandler(async (req, res) => {
    const body = req.body as {
      currency?: string;
      depositFiat?: number;
      receivedUsdt?: number;
      correctionUsdt?: number;
      gasFeeUsdt?: number;
    };
    res.json(
      await previewCostAnalysis({
        currency: String(body.currency ?? 'JPY'),
        depositFiat: Number(body.depositFiat ?? 0),
        receivedUsdt: Number(body.receivedUsdt ?? 0),
        correctionUsdt: Number(body.correctionUsdt ?? 0),
        gasFeeUsdt: Number(body.gasFeeUsdt ?? 0),
      }),
    );
  }),
);

router.post(
  '/cost',
  asyncHandler(async (req, res) => {
    const body = req.body as {
      currency?: string;
      depositFiat?: number;
      receivedUsdt?: number;
      correctionUsdt?: number;
      gasFeeUsdt?: number;
      note?: string;
    };
    res.json(
      await createCostAnalysis(req.user!, {
        currency: String(body.currency ?? 'JPY'),
        depositFiat: Number(body.depositFiat ?? 0),
        receivedUsdt: Number(body.receivedUsdt ?? 0),
        correctionUsdt: Number(body.correctionUsdt ?? 0),
        gasFeeUsdt: Number(body.gasFeeUsdt ?? 0),
        note: body.note,
      }),
    );
  }),
);

router.get(
  '/profit',
  asyncHandler(async (_req, res) => {
    res.json(await listProfitAnalysis());
  }),
);

router.patch(
  '/profit/:ticketId/broker',
  asyncHandler(async (req, res) => {
    const amount = Number((req.body as { brokerUsdtAmount?: number }).brokerUsdtAmount);
    res.json(await setBrokerUsdt(req.user!, req.params.ticketId, amount));
  }),
);

export default router;

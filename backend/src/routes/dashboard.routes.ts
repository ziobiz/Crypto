import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { getDashboardCharts, type ChartRange } from '../services/dashboard-charts.service';

const router = Router();

const VALID_RANGES = new Set<ChartRange>(['7d', '30d', '12m']);

router.get(
  '/charts',
  authenticate,
  asyncHandler(async (req, res) => {
    const raw = String(req.query.range ?? '30d');
    const range: ChartRange = VALID_RANGES.has(raw as ChartRange) ? (raw as ChartRange) : '30d';
    res.json(await getDashboardCharts(req.user!, range));
  }),
);

export default router;

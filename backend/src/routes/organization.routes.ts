import { Router } from 'express';
import { OrgType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';
import { organizationService } from '../services/organization.service';

const router = Router();

/** 회원가입 시 영업점 선택용 */
router.get(
  '/sales-offices',
  asyncHandler(async (_req, res) => {
    const orgs = await prisma.organization.findMany({
      where: { type: OrgType.SALES_OFFICE, isActive: true, deletedAt: null },
      select: { id: true, code: true, name: true, path: true },
      orderBy: { name: 'asc' },
    });
    res.json(orgs);
  }),
);

const createSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(OrgType),
  parentId: z.string().nullable().optional(),
  code: z.string().min(2).max(32).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

router.get(
  '/commission-grid',
  authenticate,
  requireRoles('SUPER_ADMIN', 'ORG_STAFF'),
  asyncHandler(async (req, res) => {
    const { getCommissionGrid } = await import('../services/commission.service');
    const grid = await getCommissionGrid();
    const path = req.user?.organizationPath;
    if (req.user?.role === 'ORG_STAFF' && path) {
      res.json({
        ...grid,
        rows: grid.rows.filter((r) => r.path === path || r.path.startsWith(`${path}/`)),
      });
      return;
    }
    res.json(grid);
  }),
);

router.get(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'ORG_STAFF', 'ORGANIZER', 'SETTLEMENT_ADMIN'),
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    res.json(await organizationService.list(req.user!, includeInactive));
  }),
);

router.post(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'ORG_STAFF'),
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const org = await organizationService.create(req.user!, body);
    res.status(201).json(org);
  }),
);

router.patch(
  '/:id',
  authenticate,
  requireRoles('SUPER_ADMIN', 'ORG_STAFF'),
  asyncHandler(async (req, res) => {
    const body = updateSchema.parse(req.body);
    res.json(await organizationService.update(req.user!, req.params.id, body));
  }),
);

router.delete(
  '/:id',
  authenticate,
  requireRoles('SUPER_ADMIN', 'ORG_STAFF'),
  asyncHandler(async (req, res) => {
    res.json(await organizationService.softDelete(req.user!, req.params.id));
  }),
);

export default router;

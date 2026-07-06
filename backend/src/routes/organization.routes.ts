import { Router } from 'express';
import { OrgType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

/** 회원가입 시 영업점 선택용 */
router.get(
  '/sales-offices',
  asyncHandler(async (_req, res) => {
    const orgs = await prisma.organization.findMany({
      where: { type: OrgType.SALES_OFFICE, isActive: true },
      select: { id: true, code: true, name: true, path: true },
      orderBy: { name: 'asc' },
    });
    res.json(orgs);
  }),
);

/** 사용자관리 — 조직 선택 드롭다운 */
router.get(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'ORG_STAFF'),
  asyncHandler(async (req, res) => {
    const where =
      req.user!.role === 'SUPER_ADMIN' || !req.user!.organizationPath
        ? { isActive: true }
        : { isActive: true, path: { startsWith: req.user!.organizationPath } };

    const orgs = await prisma.organization.findMany({
      where,
      select: { id: true, code: true, name: true, type: true, path: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    res.json(orgs);
  }),
);

export default router;

import { Router } from 'express';
import { OrgType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';

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

export default router;

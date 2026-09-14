import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../lib/jwt';
import { AppError } from '../lib/errors';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  (async () => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const token = header.slice(7);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        organization: { select: { path: true, type: true } },
        customerProfile: { select: { id: true, operatorsEnabled: true } },
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new AppError(401, 'User not found or inactive', 'UNAUTHORIZED');
    }

    let customerProfileId = user.customerProfile?.id ?? null;
    let merchantAdminUserId: string | null =
      user.role === UserRole.CUSTOMER ? user.id : (user.merchantAdminUserId ?? null);
    let operatorsEnabled = user.customerProfile?.operatorsEnabled === true;

    if (user.role === UserRole.CUSTOMER_OPERATOR) {
      if (!user.merchantAdminUserId) {
        throw new AppError(403, 'Operator is not linked to a merchant admin', 'FORBIDDEN');
      }
      const admin = await prisma.user.findUnique({
        where: { id: user.merchantAdminUserId },
        include: { customerProfile: { select: { id: true, operatorsEnabled: true } } },
      });
      if (!admin || !admin.isActive || admin.deletedAt) {
        throw new AppError(401, 'Merchant admin is inactive', 'UNAUTHORIZED');
      }
      if (!admin.customerProfile?.operatorsEnabled) {
        throw new AppError(403, 'Multi-user is not enabled for this merchant', 'FORBIDDEN');
      }
      customerProfileId = admin.customerProfile.id;
      merchantAdminUserId = admin.id;
      operatorsEnabled = true;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationPath: user.organization?.path ?? null,
      organizationType: user.organization?.type ?? null,
      customerProfileId,
      merchantAdminUserId,
      operatorsEnabled,
    };

    next();
  })().catch(next);
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }
    next();
  };
}

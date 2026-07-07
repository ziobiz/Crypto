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
        customerProfile: { select: { id: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found or inactive', 'UNAUTHORIZED');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationPath: user.organization?.path ?? null,
      organizationType: user.organization?.type ?? null,
      customerProfileId: user.customerProfile?.id ?? null,
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

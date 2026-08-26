import { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';
import { verifyStepUpToken } from '../lib/jwt';
import { isCostAnalysisRole } from '../constants/hq-admin';

export function requireCostAnalysisRole(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
  if (!isCostAnalysisRole(req.user.role)) {
    throw new AppError(403, 'Trade analysis is HQ admin / Organizer only', 'FORBIDDEN');
  }
  next();
}

export function requireSensitiveOtp(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
  const token = String(req.headers['x-sensitive-token'] ?? '');
  if (!token) {
    throw new AppError(401, 'Sensitive OTP required', 'SENSITIVE_OTP_REQUIRED');
  }
  verifyStepUpToken(token, req.user.id);
  next();
}

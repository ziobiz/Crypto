import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { AppError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];
const OTP_EXPIRES_IN = (process.env.OTP_JWT_EXPIRES_IN ?? '5m') as SignOptions['expiresIn'];
const FLOW_EXPIRES_IN = (process.env.FLOW_JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface OtpJwtPayload {
  sub: string;
  purpose: 'otp_login';
  method: 'totp';
}

export interface FlowJwtPayload {
  sub: string;
  purpose: 'password_change' | 'otp_enroll';
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function signOtpToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: 'otp_login', method: 'totp' }, JWT_SECRET, {
    expiresIn: OTP_EXPIRES_IN,
  });
}

export function signFlowToken(userId: string, purpose: FlowJwtPayload['purpose']): string {
  return jwt.sign({ sub: userId, purpose }, JWT_SECRET, { expiresIn: FLOW_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload & { purpose?: string };
    if (payload.purpose) {
      throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
    }
    return payload;
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
  }
}

export function verifyOtpToken(token: string): OtpJwtPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as OtpJwtPayload;
    if (payload.purpose !== 'otp_login' || payload.method !== 'totp' || !payload.sub) {
      throw new AppError(401, 'Invalid OTP session', 'INVALID_OTP_TOKEN');
    }
    return payload;
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(401, 'Invalid or expired OTP session', 'INVALID_OTP_TOKEN');
  }
}

export function verifyFlowToken(token: string, purpose: FlowJwtPayload['purpose']): FlowJwtPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as FlowJwtPayload;
    if (payload.purpose !== purpose || !payload.sub) {
      throw new AppError(401, 'Invalid or expired session', 'INVALID_FLOW_TOKEN');
    }
    return payload;
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(401, 'Invalid or expired session', 'INVALID_FLOW_TOKEN');
  }
}

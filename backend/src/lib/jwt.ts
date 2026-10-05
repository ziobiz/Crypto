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
  purpose: 'otp_login' | 'step_up';
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

export function signStepUpToken(userId: string, expiresMinutes = 10): string {
  const minutes = Math.min(60, Math.max(1, Math.round(Number(expiresMinutes) || 10)));
  return jwt.sign({ sub: userId, purpose: 'step_up', method: 'totp' }, JWT_SECRET, {
    expiresIn: `${minutes}m` as SignOptions['expiresIn'],
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

export function verifyStepUpToken(token: string, userId: string): void {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as OtpJwtPayload;
    if (payload.purpose !== 'step_up' || payload.method !== 'totp' || payload.sub !== userId) {
      throw new AppError(401, 'Sensitive OTP required', 'SENSITIVE_OTP_REQUIRED');
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(401, 'Sensitive OTP required', 'SENSITIVE_OTP_REQUIRED');
  }
}

export interface RegisterEmailProofPayload {
  purpose: 'register_email';
  email: string;
  challengeId: string;
}

/** 가입 이메일 인증 확인 후, 나머지 가입 입력을 마칠 수 있는 증명 (30분) */
export function signRegisterEmailProof(email: string, challengeId: string, minutes = 30): string {
  const ttl = Math.min(60, Math.max(1, Math.round(minutes)));
  return jwt.sign(
    { purpose: 'register_email', email, challengeId },
    JWT_SECRET,
    { expiresIn: `${ttl}m` as SignOptions['expiresIn'] },
  );
}

export function verifyRegisterEmailProof(token: string): RegisterEmailProofPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as RegisterEmailProofPayload;
    if (payload.purpose !== 'register_email' || !payload.email || !payload.challengeId) {
      throw new AppError(401, 'Email verification is required', 'EMAIL_NOT_VERIFIED');
    }
    return payload;
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(401, 'Email verification is required', 'EMAIL_NOT_VERIFIED');
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

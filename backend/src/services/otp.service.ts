import speakeasy from 'speakeasy';
import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HQ_CONFIG_KEYS, type HqEmailOtpConfig } from '../constants/hq-policy';
import {
  createEmailVerificationChallenge,
  verifyEmailVerificationCode,
} from './email-verification.service';

export async function getEmailOtpConfig(): Promise<HqEmailOtpConfig> {
  const row = await prisma.systemConfig.findUnique({ where: { key: HQ_CONFIG_KEYS.emailOtp } });
  if (row?.value) {
    return { ...defaultEmailOtpConfig(), ...(row.value as HqEmailOtpConfig) };
  }
  return defaultEmailOtpConfig();
}

export function defaultEmailOtpConfig(): HqEmailOtpConfig {
  return {
    otpEnabled: true,
    otpForSuperAdmin: true,
    otpForHeadOffice: true,
    otpForMasterDistributor: true,
    otpExpireMinutes: 5,
    otpEmailSubject: '[Crypto Workflow] 인증번호 {code}',
    otpEmailBody:
      '안녕하세요 {name}님,\n\n인증번호: {code}\n유효시간: {minutes}분\n\n본인이 요청하지 않았다면 무시하세요.',
    smtpHost: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER ?? 'ziobizm@gmail.com',
    smtpPassword: process.env.SMTP_PASSWORD ?? '',
    fromAddress: process.env.SMTP_FROM ?? 'ziobizm@gmail.com',
    fromName: 'Crypto Workflow',
    tradeReceiptEmailEnabled: true,
  };
}

export async function saveEmailOtpConfig(config: HqEmailOtpConfig): Promise<HqEmailOtpConfig> {
  const existing = await getEmailOtpConfig();
  const merged: HqEmailOtpConfig = {
    ...config,
    smtpPassword:
      config.smtpPassword && config.smtpPassword !== '********'
        ? config.smtpPassword
        : existing.smtpPassword,
  };
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.emailOtp },
    create: { key: HQ_CONFIG_KEYS.emailOtp, value: merged as object, description: '이메일·OTP (PG)' },
    update: { value: merged as object },
  });
  return merged;
}

/** PG — 모든 회원 OTP(TOTP) 로그인 */
export function userRequiresOtp(_user: User, cfg: HqEmailOtpConfig): boolean {
  return cfg.otpEnabled;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export function verifyTotpCode(secret: string, code: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code.replace(/\s/g, ''),
    window: 1,
  });
}

export function generateTotpSecret(email: string): { secret: string; otpauthUrl: string } {
  const secret = speakeasy.generateSecret({
    name: `Crypto Workflow (${email})`,
    length: 20,
  });
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url ?? '',
  };
}

export async function sendOtpEnrollEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const cfg = await getEmailOtpConfig();
  await createEmailVerificationChallenge(user.email, 'OTP_ENROLL', cfg, user.name);
}

export async function verifyOtpEnrollEmail(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  return verifyEmailVerificationCode(user.email, 'OTP_ENROLL', code);
}

export async function issuePendingTotpSecret(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const { secret, otpauthUrl } = generateTotpSecret(user.email);
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: secret, totpEnabled: false },
  });
  return { secret, otpauthUrl };
}

export async function activateTotp(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpSecret) return false;
  if (!verifyTotpCode(user.totpSecret, code)) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: true },
  });
  return true;
}

export async function clearUserTotp(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: null, totpEnabled: false },
  });
}

export function isSmtpConfigured(cfg: HqEmailOtpConfig): boolean {
  return Boolean(cfg.smtpHost || process.env.SMTP_HOST);
}
